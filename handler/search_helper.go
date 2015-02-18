package handler

import (
	"encoding/json"
	"regexp"
	"github.com/mattbaird/elastigo/lib"

	"github.com/untoldone/bloomapi/api"
)

var esTypeExceptionRegex = regexp.MustCompile(`FormatException`)

func phraseMatches (paramSets []*SearchParamSet) []interface{} {
	elasticPhrases := make([]interface{}, len(paramSets))
	for index, set := range paramSets {
		shouldValues := make([]map[string]interface{}, len(set.Values))
		for vIndex, value := range set.Values {
			switch (set.Op) {
			case "eq":
				shouldValues[vIndex] = map[string]interface{} {
					"match_phrase": map[string]interface{} {
						set.Key: value,
					},
				}
			case "fuzzy":
				shouldValues[vIndex] = map[string]interface{} {
					"fuzzy": map[string]interface{} {
						set.Key: value,
					},
				}
			case "prefix":
				shouldValues[vIndex] = map[string]interface{} {
					"prefix": map[string]interface{} {
						set.Key: value,
					},
				}
			case "gte":
				shouldValues[vIndex] = map[string]interface{} {
					"range": map[string]interface{} {
						set.Key: map[string]interface{} {
							"gte": value,
						},
					},
				}
			case "gt":
				shouldValues[vIndex] = map[string]interface{} {
					"range": map[string]interface{} {
						set.Key: map[string]interface{} {
							"gt": value,
						},
					},
				}
			case "lte":
				shouldValues[vIndex] = map[string]interface{} {
					"range": map[string]interface{} {
						set.Key: map[string]interface{} {
							"lte": value,
						},
					},
				}
			case "lt":
				shouldValues[vIndex] = map[string]interface{} {
					"range": map[string]interface{} {
						set.Key: map[string]interface{} {
							"lt": value,
						},
					},
				}
			}
		}

		elasticPhrases[index] = map[string]interface{} {
			"bool": map[string]interface{} {
				"should": shouldValues,
			},
		}
	}

	return elasticPhrases
}

func Search(sourceType string, params *SearchParams) (map[string]interface{}, error) {
	conn := api.Conn().SearchConnection()

	query := map[string]interface{} {
			"from": params.Offset,
			"size": params.Limit,
			"query": map[string]interface{} {
				"bool": map[string]interface{} {
					"must": phraseMatches(params.paramSets),
				},
			},
		}

	result, err := conn.Search("source", sourceType, nil, query)
	if err != nil {
		switch terr := err.(type) {
		case elastigo.ESError:
			if esTypeExceptionRegex.MatchString(terr.What) {
				return nil, api.NewParamsError("one or more values were of an unexpected type", map[string]string{})
			}	else {
				return nil, err
			}
		default:
			return nil, err
		}
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

	return cleanedResult, nil;
}