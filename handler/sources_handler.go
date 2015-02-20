package handler

import (
	"net/http"
	"time"
	"log"
	"github.com/gorilla/context"

	"github.com/untoldone/bloomapi/api"
)

type dataSource struct {
	Source string `json:"source"`
	Updated time.Time `json:"updated"`
	Checked time.Time `json:"checked"`
	Status string `json:"status"`
}

func SourcesHandler (w http.ResponseWriter, req *http.Request) {
	conn := api.Conn()
	apiKey, ok := context.Get(req, "api_key").(string)
	log.Println(apiKey)
	if !ok {
		apiKey = ""
	}

	searchTypes, err := conn.SearchTypesWithKey(apiKey)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	sources := make([]dataSource, len(searchTypes))
	for i, searchType := range searchTypes {
		sources[i] = dataSource{
			Source: searchType.Name,
			Updated: searchType.LastUpdated,
			Checked: searchType.LastChecked,
			Status: "READY",
		}

		// Backcompat Feb 13, 2015
		if searchType.Name == "usgov.hhs.npi" {
			sources[i] = dataSource{
				Source: "NPI",
				Updated: searchType.LastUpdated,
				Checked: searchType.LastChecked,
				Status: "READY",
			}
		}
	}

	api.Render(w, req, http.StatusOK, map[string][]dataSource{"result": sources})
}