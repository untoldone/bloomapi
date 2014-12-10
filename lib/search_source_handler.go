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
		r.JSON(w, http.StatusBadRequest, err)
		return
	}

	results, err := search(source, params)
	if err != nil {
		log.Println(err)
		r.JSON(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	
	r.JSON(w, http.StatusOK, results)
	return
}