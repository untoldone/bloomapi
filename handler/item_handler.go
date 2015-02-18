package handler

import (
	"regexp"
	"net/http"
	"encoding/json"
	"strings"
	"github.com/gorilla/mux"
	"github.com/mattbaird/elastigo/lib"
	"log"

	"github.com/untoldone/bloomapi/api"
)

var validElasticSearchRegexp = regexp.MustCompile(`\A[a-zA-Z0-9\-\_\:\.]+\z`)

func ItemHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := strings.ToLower(vars["source"])
	id := vars["id"]

	conn := api.Conn().SearchConnection()

	if !validElasticSearchRegexp.MatchString(source) {
		api.Render(w, req, http.StatusNotFound, "item not found")
		return
	}

	if !validElasticSearchRegexp.MatchString(id) {
		api.Render(w, req, http.StatusNotFound, "item not found")
		return
	}

	if source != "usgov.hhs.npi" {
		api.AddMessage(req, "Warning: Use the dataset, '" + source + "', without an API key is for development-use only. Use of this API without a key may be rate-limited in the future. For hosted, production access, please email 'support@bloomapi.com' for an API key.")
		api.AddMessage(req, "Warning: The dataset, '" + source + "', is currently in beta and is subject to change. If you'd like to be notified before changes to this dataset, email 'support@bloomapi.com' and ask for an API key referencing this message.")
	}

	result, err := conn.Get("source", source, id, nil)
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

	api.Render(w, req, http.StatusOK, body)
	return
}