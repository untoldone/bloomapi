package api

import (
	"net/http"
	"github.com/unrolled/render"
)

var defaultRenderer = render.New(render.Options{})

func Render(w http.ResponseWriter, req *http.Request, status int, v interface{}) {
	vars := req.URL.Query()

	messages := GetMessages(req)
	if body, ok := v.(map[string]interface{}); ok && len(messages) > 0 {
		if m, ok := body["meta"]; ok {
			if meta, ok := m.(map[string]interface{}); ok {
				meta["messages"] = messages
			}
		} else {
			body["meta"] = map[string]interface{} {
				"messages": messages,
			}
		}
	}
	
	if callback, ok := vars["callback"]; ok {
		defaultRenderer.JSONP(w, status, callback[0], v)
	} else {
		defaultRenderer.JSON(w, status, v)
	}
}