package bloomapi

import (
	"net/http"
	"regexp"
	"strings"
	"strconv"
	"encoding/json"
	"github.com/untoldone/bloomdb"
	"log"
)

type searchParams struct {
	Offset uint64
	Limit uint64
	Phrases map[string]string
}

type paramSet struct {
	Key string
	Op string
	Value string
}

func (p *paramSet) SetKey(key string) {
	p.Key = key
}

func (p *paramSet) SetOp(op string) {
	p.Op = op
}

func (p *paramSet) SetValue(value string) {
	p.Value = value
}

var keyRegexp = regexp.MustCompile("\\Akey(\\d+)\\z")
var valueRegexp = regexp.MustCompile("\\Avalue(\\d+)\\z")
var opRegexp = regexp.MustCompile("\\Aop(\\d+)\\z")

func parseParams (params map[string][]string) (*searchParams, error) {
	// Ensure no unknown parameters
	unknown := make([]string, 0)
	for key, _ := range params {
		if key != "limit" &&
			 key != "offset" &&
			 !keyRegexp.MatchString(key) &&
			 !valueRegexp.MatchString(key) &&
			 !opRegexp.MatchString(key) {
			unknown = append(unknown, key)
		}
	}
	if len(unknown) > 0 {
		message := strings.Join(unknown, ", ") + " are unknown parameters"

		paramsMap := map[string]string{}
		for _, key := range unknown {
			paramsMap[key] = "is an unknown parameter"
		}

		return nil, NewParamsError(message, paramsMap)
	}

	// No parameters can be specified multiple times
	for key, values := range params {
		if len(values) > 1 {
			return nil, NewParamsError(key + " must not be repeated more than once", 
																map[string]string {key:"must not be repeated more than once"})
		}
	}

	// Ensure params in sets of key/op/value
	//  and ensure no op is not 'eq' as it is the currently only support op
	paramSets := map[string]*paramSet{}
	for key, value := range params {
		if keyRegexp.MatchString(key) {
			sub := keyRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &paramSet{}
			}

			paramSets[index].SetKey(value[0])
		}

		if valueRegexp.MatchString(key) {
			sub := valueRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &paramSet{}
			}

			paramSets[index].SetValue(value[0])
		}

		if opRegexp.MatchString(key) {
			sub := opRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &paramSet{}
			}

			paramSets[index].SetOp(value[0])
		}
	}

	for _, set := range paramSets {
		if set.Key == "" {
			return nil, NewParamsError("one or more key/op/value sets are missing a key", map[string]string{})
		}

		if set.Value == "" {
			return nil, NewParamsError("one or more key/op/value sets are missing a value", map[string]string{})
		}

		if set.Op == "" {
			return nil, NewParamsError("one or more key/op/value sets are missing a op", map[string]string{})
		}

		if set.Op != "eq" {
			return nil, NewParamsError("invalid operation " + set.Op, map[string]string{})
		}
	}

	// Ensure at least one key/value/op pair
	if len(paramSets) == 0 {
		return nil, NewParamsError("search requires at least one set of search parameters (e.g. key1/op1/value1)", map[string]string{})
	}

	var err error
	// Ensure offset/ limit are positive integers
	var offsetValue uint64
	if offset, ok := params["offset"]; ok {
		offsetValue, err = strconv.ParseUint(offset[0], 0, 64)
		if err != nil {
			return nil, NewParamsError("offset must be a positive number", 
																map[string]string{"offset": "must be a positive number"})
		}
	}

	var limitValue uint64
	if limit, ok := params["limit"]; ok {
		limitValue, err = strconv.ParseUint(limit[0], 0, 64)
		if err != nil {
			return nil, NewParamsError("limit must be a positive number", 
																map[string]string{"limit": "must be a positive number"})
		}

		// Ensure limit is less than 100
		if limitValue > 100 {
			return nil, NewParamsError("limit must be less than 100", 
																map[string]string{"limit": "must less than 100"})
		}
	}

	phrases := map[string]string{}
	for _, param := range paramSets {
		phrases[param.Key] = param.Value
	}

	if limitValue == 0 {
		limitValue = 100
	}

	return &searchParams{
			offsetValue,
			limitValue,
			phrases,
		}, nil
}

func phraseMatches (phrases map[string]string) []interface{} {
	elasticPhrases := make([]interface{}, 0)
	for key, value := range phrases {
		elasticPhrases = append(elasticPhrases, map[string]interface{} {
				"match_phrase": map[string]interface{} {
					key: value,
				},
			})
	}

	return elasticPhrases
}

func keysToStrings(toConvert map[string]interface{}) {
	for k, v := range toConvert {
		switch v.(type) {
		case int:
			toConvert[k] = strconv.Itoa(v.(int))
		case float64:
			toConvert[k] = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		case map[string]interface{}:
			keysToStrings(v.(map[string]interface{}))
		case []interface{}:
			for _, elm := range v.([]interface{}) {
				keysToStrings(elm.(map[string]interface{}))
			}
		}
	}
}

func SearchHandler (w http.ResponseWriter, req *http.Request) {
	params, err := parseParams(req.URL.Query())
	if err != nil {
		r.JSON(w, http.StatusBadRequest, err)
		return
	}

	bdb := bloomdb.CreateDB()
	conn := bdb.SearchConnection()

	query := map[string]interface{} {
			"from": params.Offset,
			"size": params.Limit,
			"query": map[string]interface{} {
				"bool": map[string]interface{} {
					"must": phraseMatches(params.Phrases),
				},
			},
		}

	result, err := conn.Search("source", "npi", nil, query)
	if err != nil {
		log.Println(err)
		r.JSON(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	hits := make([]interface{}, len(result.Hits.Hits))
	for i, hit := range result.Hits.Hits {
		var source map[string]interface{}
		json.Unmarshal(*hit.Source, &source)
		hits[i] = source
	}

	cleanedResult := map[string]interface{} {
			"meta": map[string]interface{} {
				"rowCount": result.Hits.Total,
			},
			"result": hits,
		}

	keysToStrings(cleanedResult)

	r.JSON(w, http.StatusOK, cleanedResult)
	return
}