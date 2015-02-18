package handler

import (
	"net/http"
	"github.com/gorilla/mux"
	"strings"
	"log"

	"github.com/untoldone/bloomapi/api"
)

func SearchSourceHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := strings.ToLower(vars["source"])

	if !validElasticSearchRegexp.MatchString(source) {
		api.Render(w, req, http.StatusOK, map[string]interface{}{
			"meta": map[string]interface{}{
				"rowCount": 0,
			},
			"result": []string{},
		})
		return
	}

	params, err := ParseSearchParams(req.URL.Query())
	if err != nil {
		api.Render(w, req, http.StatusBadRequest, err)
		return
	}

	results, err := Search(source, params, req)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	
	api.Render(w, req, http.StatusOK, results)
	return
}