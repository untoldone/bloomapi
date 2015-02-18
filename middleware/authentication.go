package middleware

import (
	"net/http"
	
	"github.com/untoldone/bloomapi/api"
)

type Authentication struct {}

func NewAuthentication() *Authentication {
	return &Authentication{}
}

func (s *Authentication) ServeHTTP(rw http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	vars := r.URL.Query()
	secret := vars["secret"]

	if len(secret) > 0 && secret[0] != "" {
		api.Render(rw, r, 401, map[string]string{
			"name": "Unauthorized",
			"message": "Please contact support@bloomapi.com if this is in error",
		})
	} else {
		next(rw, r)
	}
}