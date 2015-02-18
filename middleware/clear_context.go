package middleware

import (
	"net/http"
	"github.com/gorilla/context"
)

type ClearContext struct {}

func NewClearContext() *ClearContext {
	return &ClearContext{}
}

func (s *ClearContext) ServeHTTP(rw http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	context.Clear(r)
	next(rw, r)
}