package bloomapi

import (
	"net/http"
	"github.com/unrolled/render"
	"github.com/gorilla/context"
)

var defaultRenderer = render.New(render.Options{})

func preJSONP(rw http.ResponseWriter, req *http.Request, next http.HandlerFunc) {
	vars := req.URL.Query()
	callback := vars["callback"]

	if callback != nil {
		context.Set(req, "callbackName", callback[0])
	}

	next(rw, req)
}

func renderJSON(w http.ResponseWriter, req *http.Request, status int, v interface{}) {
	callbackName, ok := context.GetOk(req, "callbackName")
	if ok {
		defaultRenderer.JSONP(w, status, callbackName.(string), v)
	} else {
		defaultRenderer.JSON(w, status, v)
	}
}