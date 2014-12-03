package bloomapi

import (
	"net/http"
	"github.com/gorilla/mux"
	"github.com/untoldone/bloomdb"
	"log"
)

func NpiHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	npi := vars["npi"]

	bdb := bloomdb.CreateDB()
	conn := bdb.SearchConnection()

	result, err := conn.Search("source", "npi", nil, map[string]interface{} {
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
		r.JSON(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if result.Hits.Total == 0 {
		r.JSON(w, http.StatusNotFound, "npi not found")
		return
	} else {
		r.JSON(w, http.StatusOK, map[string]interface{} {"result": result.Hits.Hits[0].Source})
		return
	}
}