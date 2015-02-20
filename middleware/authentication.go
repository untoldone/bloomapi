package middleware

import (
	"log"
	"net/http"
	"database/sql"
	"github.com/gorilla/context"

	"github.com/untoldone/bloomapi/api"
)

type Authentication struct {}

func NewAuthentication() *Authentication {
	return &Authentication{}
}

func (s *Authentication) ServeHTTP(rw http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	vars := r.URL.Query()
	secret := vars["secret"]

	if len(secret) > 1 {
		api.Render(rw, r, 401, map[string]string{
			"name": "Unauthorized",
			"message": "Please contact support@bloomapi.com if this is in error",
		})
		return
	}

	if len(secret) == 1 {
		conn, err := api.Conn().SqlConnection()
		if err != nil {
			log.Println(err)
	  	api.Render(rw, r, http.StatusInternalServerError, "Internal Server Error")
	  	return
		}

		var t int
		err = conn.QueryRow(`SELECT 1 FROM api_keys WHERE key = $1`, secret[0]).Scan(&t)
		if err == sql.ErrNoRows {
			api.Render(rw, r, 401, map[string]string{
				"name": "Unauthorized",
				"message": "Please contact support@bloomapi.com if this is in error",
			})
			return
		} else if err != nil {
			log.Println(err)
	  	api.Render(rw, r, http.StatusInternalServerError, "Internal Server Error")
	  	return
		}

  	context.Set(r, "api_key", secret[0])
  	next(rw, r)
	} else {
		next(rw, r)
	}
}