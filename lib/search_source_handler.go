package bloomapi

import (
	"net/http"
	"github.com/gorilla/mux"
	"log"
)

func SearchSourceHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := vars["source"]

	params, err := parseParams(req.URL.Query())
	if err != nil {
		renderJSON(w, req, http.StatusBadRequest, err)
		return
	}

	results, err := search(source, params)
	if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	
	renderJSON(w, req, http.StatusOK, results)
	return
}