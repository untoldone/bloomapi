package handler

import (
	"net/http"
	"time"
	"log"

	"github.com/untoldone/bloomapi/api"
)

type dataSource struct {
	Source string `json:"source"`
	Updated time.Time `json:"updated"`
	Checked time.Time `json:"checked"`
	Status string `json:"status"`
}

func SourcesHandler (w http.ResponseWriter, req *http.Request) {

	conn, err := api.Conn().SqlConnection()
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	rows, err := conn.Query("SELECT name, last_updated, last_checked FROM search_types")
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer rows.Close()

	var (
		source string
		update time.Time
		checked time.Time
	)

	var npiUpdated, npiChecked time.Time
	sources := make([]dataSource, 0)
	for rows.Next() {
		err := rows.Scan(&source, &update, &checked)
		if err != nil {
			log.Println(err)
			api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
			return
		}

		// Backcompat Feb 13, 2015
		if source == "usgov.hhs.npi" {
			npiUpdated = update
			npiChecked = checked
		}

		sources = append(sources, dataSource{source, update, checked, "READY"})
	}

	// Backcompat Feb 13, 2015
	sources = append(sources, dataSource{"NPI", npiUpdated, npiChecked, "READY"})

	api.Render(w, req, http.StatusOK, map[string][]dataSource{"result": sources})
}