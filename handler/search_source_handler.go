package handler

import (
	"net/http"
	"github.com/gorilla/mux"
	"github.com/gorilla/context"
	"strings"
	"log"

	"github.com/untoldone/bloomapi/api"
)

func SearchSourceHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := strings.ToLower(vars["source"])

	conn := api.Conn()
	apiKey, ok := context.Get(req, "api_key").(string)
	if !ok {
		apiKey = ""
	}

	_, ok, err := conn.SearchTypeWithNameAndKey(source, apiKey)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !ok {
		api.Render(w, req, 404, map[string]string{
			"name": "Source Not Found",
			"message": "Please contact support@bloomapi.com if this is in error",
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