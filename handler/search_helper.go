package handler

import (
	"fmt"
	"strings"
	"encoding/json"
	"regexp"
	"net/http"
	"github.com/gorilla/context"
	"github.com/mattbaird/elastigo/lib"

	"github.com/untoldone/bloomapi/api"
)

var esTypeExceptionRegex = regexp.MustCompile(`FormatException`)

var experimentalOperationMessageWithoutKey = "Warning: This query used the experimental operation, '%s'. To ensure you're notified in case breaking changes need to be made, email support@bloomapi.com and ask for an API key"
var experimentalOperationMessage = "Warning: This query used the experimental operation, '%s'."
var experimentalSort = "Warning: This query used the experimental features, 'sort'."


func phraseMatches (paramSets []*SearchParamSet, r *http.Request) []interface{} {
	apiKey, ok := context.Get(r, "api_key").(string)
	if !ok {
		apiKey = ""
	}

	elasticPhrases := make([]interface{}, len(paramSets))
	for index, set := range paramSets {
		shouldValues := make([]map[string]interface{}, len(set.Values))
		api.AddFeature(r, "op:" + set.Op)
		for vIndex, value := range set.Values {
			switch (set.Op) {
			case "eq":
				shouldValues[vIndex] = map[string]interface{} {
					"match_phrase": map[string]interface{} {
						set.Key: value,
					},
				}
			case "fuzzy":
				if apiKey == "" {
					api.AddMessage(r, fmt.Sprintf(experimentalOperationMessageWithoutKey, "fuzzy"))
				} else {
					api.AddMessage(r, fmt.Sprintf(experimentalOperationMessage, "fuzzy"))
				}

				shouldValues[vIndex] = map[string]interface{} {
					"fuzzy": map[string]interface{} {
						set.Key: value,
					},
				}
			case "prefix":
				if apiKey == "" {
					api.AddMessage(r, fmt.Sprintf(experimentalOperationMessageWithoutKey, "prefix"))
				} else {
					api.AddMessage(r, fmt.Sprintf(experimentalOperationMessage, "prefix"))
				}
				shouldValues[vIndex] = map[string]interface{} {
					"prefix": map[string]interface{} {
						set.Key: strings.ToLower(value),
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

func Search(sourceType string, params *SearchParams, r *http.Request) (map[string]interface{}, error) {
	conn := api.Conn().SearchConnection()

	apiKey, ok := context.Get(r, "api_key").(string)
	if !ok {
		apiKey = ""
	}

	if apiKey == "" {
		api.AddMessage(r, "Warning: Use of the dataset, '" + sourceType + "', without an API key is for development-use only. Use of this API without a key is rate-limited. For hosted, production access, please email 'support@bloomapi.com' for an API key.")
	}

	matches := phraseMatches(params.paramSets, r)

	var order = "asc"
	if params.Order != "" {
		order = params.Order
	}

	query := map[string]interface{} {
			"from": params.Offset,
			"size": params.Limit,
			"query": map[string]interface{} {
				"bool": map[string]interface{} {
					"must": matches,
				},
			},
		}

	if params.Sort != "" {
		if _, ok := context.Get(r, "api_key").(string); !ok {
			return nil, api.NewParamsError("'sort' is unsupported without a BloomAPI user account", map[string]string{})
		}


		query["sort"] = map[string]interface{} {
			params.Sort: map[string]interface{} {
				"order": order,
			},
		}

		api.AddFeature(r, "sort")
		api.AddMessage(r, experimentalSort)
	}

	result, err := conn.Search(sourceType, "main", nil, query)
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