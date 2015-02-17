package bloomapi

import (
	"fmt"
	"net/http"
	"github.com/gorilla/mux"
	"github.com/codegangsta/negroni"
	"github.com/gorilla/context"
	"github.com/spf13/viper"
	"github.com/gocodo/bloomdb"
)

var bdb *bloomdb.BloomDatabase

func Server() {
	fmt.Println("Running Server")

	bdb = bloomdb.CreateDB()
	router := mux.NewRouter()

	// For Backwards Compatibility Feb 13, 2015
	router.HandleFunc("/api/search", SearchHandler).Methods("GET")
	router.HandleFunc("/api/search/npi", SearchHandler).Methods("GET")
	router.HandleFunc("/api/npis/{npi:[0-9]+}", NpiHandler).Methods("GET")
	router.HandleFunc("/api/sources/npi/{npi:[0-9]+}", NpiHandler).Methods("GET")

	router.HandleFunc("/api/sources", SourcesHandler).Methods("GET")
	router.HandleFunc("/api/search/{source}", SearchSourceHandler).Methods("GET")
	router.HandleFunc("/api/sources/{source}/{id}", ItemHandler).Methods("GET")

  /*runtime.SetBlockProfileRate(1)
	dr := router.PathPrefix("/debug/pprof").Subrouter()
	dr.HandleFunc("/", pprof.Index)
	dr.HandleFunc("/cmdline", pprof.Cmdline)
	dr.HandleFunc("/profile", pprof.Profile)
	dr.HandleFunc("/symbol", pprof.Symbol)
	dr.HandleFunc("/block", pprof.Handler("block").ServeHTTP)
	dr.HandleFunc("/heap", pprof.Handler("heap").ServeHTTP)
	dr.HandleFunc("/goroutine", pprof.Handler("goroutine").ServeHTTP)
	dr.HandleFunc("/threadcreate", pprof.Handler("threadcreate").ServeHTTP)*/

	n := negroni.Classic()
	n.Use(negroni.HandlerFunc(func (rw http.ResponseWriter, req *http.Request, next http.HandlerFunc) {
			vars := req.URL.Query()
			secret := vars["secret"]

			if len(secret) > 0 && secret[0] != "" {
				renderJSON(rw, req, 401, map[string]string{
					"name": "Unauthorized",
					"message": "Please contact support@bloomapi.com if this is in error",
				})
			} else {
				next(rw, req)
			}
		}))
	n.UseHandler(context.ClearHandler(router))
	n.Run(":" + viper.GetString("bloomapiPort"))
}
