package bloomapi

import (
	"net/http"
	"encoding/json"
	"github.com/gorilla/mux"
	"log"
)

func ItemHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := vars["source"]
	id := vars["id"]

	conn := bdb.SearchConnection()

	query := map[string]interface{} {
			"query": map[string]interface{} {
				"match_phrase": map[string]interface{} {
					"id": id,
				},
			},
		}

	result, err := conn.Search("source", source, nil, query)
	if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if result.Hits.Total == 0 {
		renderJSON(w, req, http.StatusNotFound, "item not found")
		return
	} else {
		hits := make([]interface{}, len(result.Hits.Hits))
		for i, hit := range result.Hits.Hits {
			var source map[string]interface{}
			json.Unmarshal(*hit.Source, &source)
			hits[i] = source
		}

		body := map[string]interface{} {"result": hits[0]}
		keysToStrings(body)

		renderJSON(w, req, http.StatusOK, body)
		return
	}
}