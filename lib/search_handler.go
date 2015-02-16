package bloomapi

import (
	"net/http"
	"log"
)

func SearchHandler (w http.ResponseWriter, req *http.Request) {
	params, err := parseParams(req.URL.Query())
	if err != nil {
		renderJSON(w, req, http.StatusBadRequest, err)
		return
	}

	results, err := search("usgov.hhs.npi", params)
	if err != nil {
		switch err.(type) {
		case paramsError:
			renderJSON(w, req, http.StatusBadRequest, err)
			return
		default:
			log.Println(err)
			renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}
	
	renderJSON(w, req, http.StatusOK, results)
	return
}