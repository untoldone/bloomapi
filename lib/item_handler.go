package bloomapi

import (
	"net/http"
	"encoding/json"
	"strings"
	"github.com/gorilla/mux"
	"github.com/mattbaird/elastigo/lib"
	"log"
)

func ItemHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	source := strings.ToLower(vars["source"])
	id := vars["id"]

	conn := bdb.SearchConnection()

	result, err := conn.Get("source", source, id, nil)
	log.Println(err, elastigo.RecordNotFound)
	if err != nil && err.Error() == elastigo.RecordNotFound.Error() {
		renderJSON(w, req, http.StatusNotFound, "item not found")
		return
	} else if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var found map[string]interface{}
	err = json.Unmarshal(*result.Source, &found)
	if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	body := map[string]interface{} { "result": found }
	keysToStrings(body)

	renderJSON(w, req, http.StatusOK, body)
	return
}