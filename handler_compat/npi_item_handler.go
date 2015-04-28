package handler_compat

import (
	"net/http"
	"encoding/json"
	"github.com/gorilla/mux"
	"log"

	"github.com/untoldone/bloomapi/api"
)

func NpiItemHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	npi := vars["npi"]

	conn := api.Conn().SearchConnection()

	result, err := conn.Search("usgov.hhs.npi", "main", nil, map[string]interface{} {
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
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if result.Hits.Total == 0 {
		api.Render(w, req, http.StatusNotFound, "npi not found")
		return
	} else {
		hits := make([]interface{}, len(result.Hits.Hits))
		for i, hit := range result.Hits.Hits {
			var source map[string]interface{}
			json.Unmarshal(*hit.Source, &source)
			hits[i] = source
		}

		body := map[string]interface{} {"result": hits[0]}
		valuesToStrings(body)

		api.Render(w, req, http.StatusOK, body)
		return
	}
}