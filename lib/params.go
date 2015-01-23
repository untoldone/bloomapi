package bloomapi

import (
	"regexp"
	"strings"
	"strconv"
)

type searchParams struct {
	Offset uint64
	Limit uint64
	paramSets []*paramSet
}

type paramSet struct {
	Key string
	Op string
	Values []string
}

func (p *paramSet) SetKey(key string) {
	p.Key = key
}

func (p *paramSet) SetOp(op string) {
	p.Op = op
}

func (p *paramSet) SetValues(values []string) {
	p.Values = values
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
			 key != "callback" &&
			 key != "secret" &&
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

	// Ensure params in sets of key/op/value
	//  and ensure no op is not 'eq' as it is the currently only support op
	paramSets := map[string]*paramSet{}
	for key, values := range params {
		if keyRegexp.MatchString(key) {
			sub := keyRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &paramSet{}
			}

			paramSets[index].SetKey(values[0])
		}

		if valueRegexp.MatchString(key) {
			sub := valueRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &paramSet{}
			}

			paramSets[index].SetValues(values)
		}

		if opRegexp.MatchString(key) {
			sub := opRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &paramSet{}
			}

			paramSets[index].SetOp(values[0])
		}
	}

	for _, set := range paramSets {
		if set.Key == "" {
			return nil, NewParamsError("one or more key/op/value sets are missing a key", map[string]string{})
		}

		if set.Values == nil || len(set.Values) == 0 {
			return nil, NewParamsError("one or more key/op/value sets are missing a value", map[string]string{})
		}

		if set.Op == "" {
			return nil, NewParamsError("one or more key/op/value sets are missing a op", map[string]string{})
		}

		if set.Op != "eq" &&
				set.Op != "fuzzy" && 
				set.Op != "prefix" && 
				set.Op != "gte" &&
				set.Op != "gt" &&
				set.Op != "lte" &&
				set.Op != "lt" {
			return nil, NewParamsError("invalid operation " + set.Op, map[string]string{})
		}
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

	if limitValue == 0 {
		limitValue = 100
	}

	listSets := make([]*paramSet, len(paramSets))
	i := 0
	for _, v := range paramSets {
		listSets[i] = v
		i += 1
	}

	return &searchParams{
			offsetValue,
			limitValue,
			listSets,
		}, nil
}
