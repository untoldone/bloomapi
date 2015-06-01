package handler_compat

import (
	"net/http"
	"log"

	"github.com/untoldone/bloomapi/api"
	"github.com/untoldone/bloomapi/handler"
)

func NpiSearchHandler (w http.ResponseWriter, req *http.Request) {
	params, err := handler.ParseSearchParams(req.URL.Query())
	if err != nil {
		api.Render(w, req, http.StatusBadRequest, err)
		return
	}

	results, err := handler.Search("usgov.hhs.npi", params, req)
	if err != nil {
		switch err.(type) {
		case api.ParamsError:
			api.Render(w, req, http.StatusBadRequest, err)
			return
		default:
			log.Println(err)
			api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}

	valuesToStrings(results)

	api.AddFeature(req, "usgov.hhs.npi")
	api.AddFeature(req, "handler:legacynpi:search")
	
	api.Render(w, req, http.StatusOK, results)
	return
}