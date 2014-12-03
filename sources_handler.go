package bloomapi

import (
	"net/http"
)

func SourcesHandler (w http.ResponseWriter, req *http.Request) {
	r.JSON(w, http.StatusOK, map[string]string{"welcome": "This is rendered JSON!"})
}