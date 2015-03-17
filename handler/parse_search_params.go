package handler

import (
	"regexp"
	"strings"
	"strconv"

	"github.com/untoldone/bloomapi/api"
)

type SearchParams struct {
	Offset uint64
	Limit uint64
	Sort string
	Order string
	paramSets []*SearchParamSet
}

type SearchParamSet struct {
	Key string
	Op string
	Values []string
}

func (p *SearchParamSet) SetKey(key string) {
	p.Key = key
}

func (p *SearchParamSet) SetOp(op string) {
	p.Op = op
}

func (p *SearchParamSet) SetValues(values []string) {
	p.Values = values
}

var keyRegexp = regexp.MustCompile("\\Akey(\\d+)\\z")
var valueRegexp = regexp.MustCompile("\\Avalue(\\d+)\\z")
var opRegexp = regexp.MustCompile("\\Aop(\\d+)\\z")

func ParseSearchParams(params map[string][]string) (*SearchParams, error) {
	// Ensure no unknown parameters
	unknown := make([]string, 0)
	for key, _ := range params {
		if key != "limit" &&
			 key != "offset" &&
			 key != "callback" &&
			 key != "secret" &&
			 key != "order" &&
			 key != "sort" &&
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

		return nil, api.NewParamsError(message, paramsMap)
	}

	// Ensure params in sets of key/op/value
	paramSets := map[string]*SearchParamSet{}
	for key, values := range params {
		if keyRegexp.MatchString(key) {
			sub := keyRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &SearchParamSet{}
			}

			paramSets[index].SetKey(values[0])
		}

		if valueRegexp.MatchString(key) {
			sub := valueRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &SearchParamSet{}
			}

			paramSets[index].SetValues(values)
		}

		if opRegexp.MatchString(key) {
			sub := opRegexp.FindStringSubmatch(key)
			index := sub[1]
			_, ok := paramSets[index]
			if !ok {
				paramSets[index] = &SearchParamSet{}
			}

			paramSets[index].SetOp(values[0])
		}
	}

	for _, set := range paramSets {
		if set.Key == "" {
			return nil, api.NewParamsError("one or more key/op/value sets are missing a key", map[string]string{})
		}

		if set.Values == nil || len(set.Values) == 0 {
			return nil, api.NewParamsError("one or more key/op/value sets are missing a value", map[string]string{})
		}

		hasValue := false
		for _, value := range set.Values {
			if value != "" {
				hasValue = true
				break;
			}
		}

		if !hasValue {
			return nil, api.NewParamsError("one or more key/op/value sets are missing a value", map[string]string{})
		}

		if set.Op == "" {
			return nil, api.NewParamsError("one or more key/op/value sets are missing a op", map[string]string{})
		}

		if set.Op != "eq" &&
				set.Op != "fuzzy" && 
				set.Op != "prefix" && 
				set.Op != "gte" &&
				set.Op != "gt" &&
				set.Op != "lte" &&
				set.Op != "lt" {
			return nil, api.NewParamsError("invalid operation " + set.Op, map[string]string{})
		}
	}

	var err error
	// Ensure offset/ limit are positive integers
	var offsetValue uint64
	if offset, ok := params["offset"]; ok {
		offsetValue, err = strconv.ParseUint(offset[0], 0, 64)
		if err != nil {
			return nil, api.NewParamsError("offset must be a positive number", 
																map[string]string{"offset": "must be a positive number"})
		}
	}

	var limitValue uint64
	if limit, ok := params["limit"]; ok {
		limitValue, err = strconv.ParseUint(limit[0], 0, 64)
		if err != nil {
			return nil, api.NewParamsError("limit must be a positive number", 
																map[string]string{"limit": "must be a positive number"})
		}

		// Ensure limit is less than 100
		if limitValue > 100 {
			return nil, api.NewParamsError("limit must be less than 100", 
																map[string]string{"limit": "must less than 100"})
		}
	}

	var sort, order string
	if sortList, ok := params["sort"]; ok {
		if orderList, ok := params["order"]; ok {
			if orderList[0] != "desc" && orderList[0] != "asc" {
				return nil, api.NewParamsError("order must be 'asc' or 'desc'", map[string]string{"order": "must be 'asc' or 'desc'"})
			}

			order = orderList[0]
		}

		sort = sortList[0]
	} else {
		if _, ok := params["order"]; ok {
			return nil, api.NewParamsError("order may not be present without sort", map[string]string{"order": "may not be present without 'sort'"})
		}
	}

	if limitValue == 0 {
		limitValue = 100
	}

	listSets := make([]*SearchParamSet, len(paramSets))
	i := 0
	for _, v := range paramSets {
		listSets[i] = v
		i += 1
	}

	return &SearchParams{
			Offset: offsetValue,
			Limit: limitValue,
			Sort: sort,
			Order: order,
			paramSets: listSets,
		}, nil
}