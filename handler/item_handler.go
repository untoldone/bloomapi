package handler

import (
	"net/http"
	"encoding/json"
	"strings"
	"github.com/gorilla/mux"
	"github.com/mattbaird/elastigo/lib"
	"log"

	"github.com/untoldone/bloomapi/api"
)

func ItemHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := strings.ToLower(vars["source"])
	id := vars["id"]

	conn := api.Conn().SearchConnection()

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