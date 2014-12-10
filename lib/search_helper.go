package bloomapi

import (
	"encoding/json"
)

func search(sourceType string, params *searchParams) (map[string]interface{}, error) {
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