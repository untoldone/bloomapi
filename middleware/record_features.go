package middleware

import (
  "net/http"
  "encoding/json"
  "github.com/untoldone/bloomapi/api"
)

type RecordFeatures struct {}

func NewRecordFeatures() *RecordFeatures {
  return &RecordFeatures{}
}

func (s *RecordFeatures) ServeHTTP(rw http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	features := api.GetFeatures(r)
	j, _ := json.Marshal(features)
	featureJson := string(j)
	api.StatsLogger().Println(featureJson)
  next(rw, r)
}