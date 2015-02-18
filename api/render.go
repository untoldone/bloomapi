package api

import (
	"net/http"
	"github.com/unrolled/render"
)

var defaultRenderer = render.New(render.Options{})

func Render(w http.ResponseWriter, req *http.Request, status int, v interface{}) {
	vars := req.URL.Query()
	
	if callback, ok := vars["callback"]; ok {
		defaultRenderer.JSONP(w, status, callback[0], v)
	} else {
		defaultRenderer.JSON(w, status, v)
	}
}