package bloomapi

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/codegangsta/negroni"
	"gopkg.in/unrolled/render.v1"
	"github.com/spf13/viper"
)

var r = render.New(render.Options{})

func Server() {
	fmt.Println("Running Server")

	router := mux.NewRouter()

	router.HandleFunc("/api/search", SearchHandler).Methods("GET")
	router.HandleFunc("/api/npis/{npi:[0-9]+}", NpiHandler).Methods("GET")
	router.HandleFunc("/api/sources", SourcesHandler).Methods("GET")
	router.HandleFunc("/api/search/{source}", SearchSourceHandler).Methods("GET")
	router.HandleFunc("/api/sources/{source}/{id}", ItemHandler).Methods("GET")

	n := negroni.Classic()
	n.UseHandler(router)
	n.Run(":" + viper.GetString("bloomapiPort"))
}