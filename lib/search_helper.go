package bloomapi

import (
	"encoding/json"
)

func phraseMatches (paramSets []*paramSet) []interface{} {
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
			case "substring":
				shouldValues[vIndex] = map[string]interface{} {
					"wildcard": map[string]interface{} {
						set.Key: "*" + value + "*",
					},
				}
			case "prefix":
				shouldValues[vIndex] = map[string]interface{} {
					"prefix": map[string]interface{} {
						set.Key: value,
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

func search(sourceType string, params *searchParams) (map[string]interface{}, error) {
	conn := bdb.SearchConnection()

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
		return nil, err
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

	return cleanedResult, nil;
}