package handler

import (
	"regexp"
	"net/http"
	"encoding/json"
	"strings"
	"github.com/gorilla/mux"
	"github.com/mattbaird/elastigo/lib"
	"github.com/gorilla/context"
	"log"

	"github.com/untoldone/bloomapi/api"
)

var validElasticSearchRegexp = regexp.MustCompile(`\A[a-zA-Z0-9\-\_\:\.]+\z`)

func ItemHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := strings.ToLower(vars["source"])
	id := vars["id"]

	bloomConn := api.Conn()
	searchConn := bloomConn.SearchConnection()

	if !validElasticSearchRegexp.MatchString(source) {
		api.Render(w, req, http.StatusNotFound, "item not found")
		return
	}

	if !validElasticSearchRegexp.MatchString(id) {
		api.Render(w, req, http.StatusNotFound, "item not found")
		return
	}

	apiKey, ok := context.Get(req, "api_key").(string)
	if !ok {
		apiKey = ""
	}
	_, ok, err := bloomConn.SearchTypeWithNameAndKey(source, apiKey)
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

	if apiKey == "" {
		api.AddMessage(req, "Warning: Use of the dataset, '" + source + "', without an API key is for development-use only. Use of this API without a key without an API key is for development-use only. Use of this API without a key is rate-limited. For hosted, production access, please email 'support@bloomapi.com' for an API key.")
	}

	result, err := searchConn.Get(source, "main", id, nil)
	if err != nil && err.Error() == elastigo.RecordNotFound.Error() {
		api.Render(w, req, http.StatusNotFound, "item not found")
		return
	} else if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var found map[string]interface{}
	err = json.Unmarshal(*result.Source, &found)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	body := map[string]interface{} { "result": found }

	api.AddFeature(req, "handler:item")
	api.AddFeature(req, source)

	api.Render(w, req, http.StatusOK, body)
	return
}