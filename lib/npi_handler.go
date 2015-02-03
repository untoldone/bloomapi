package bloomapi

import (
	"net/http"
	"encoding/json"
	"github.com/gorilla/mux"
	"log"
)

func NpiHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	npi := vars["npi"]

	conn := bdb.SearchConnection()

	result, err := conn.Search("source", "usgov.hhs.npi", nil, map[string]interface{} {
			"query": map[string]interface{} {
					"filtered": map[string]interface{} {
						"filter": map[string]interface{} {
							"term": map[string]interface{} {
								"npi": npi,
							},
						},
					},
			},
		})
	if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if result.Hits.Total == 0 {
		renderJSON(w, req, http.StatusNotFound, "npi not found")
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