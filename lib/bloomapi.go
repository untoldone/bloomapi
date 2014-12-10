package bloomapi

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/codegangsta/negroni"
	"gopkg.in/unrolled/render.v1"
	"github.com/spf13/viper"
	"github.com/gocodo/bloomdb"
)

var r = render.New(render.Options{})
var bdb *bloomdb.BloomDatabase

func Server() {
	fmt.Println("Running Server")

	bdb = bloomdb.CreateDB()
	router := mux.NewRouter()

	router.HandleFunc("/api/search", SearchHandler).Methods("GET")
	router.HandleFunc("/api/npis/{npi:[0-9]+}", NpiHandler).Methods("GET")
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
	n.UseHandler(router)
	n.Run(":" + viper.GetString("bloomapiPort"))
}
