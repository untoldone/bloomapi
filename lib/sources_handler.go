package bloomapi

import (
	"net/http"
	"time"
	"log"
)

type dataSource struct {
	Source string `json:"source"`
	Updated time.Time `json:"updated"`
	Checked time.Time `json:"checked"`
	Status string `json:"status"`
}

func SourcesHandler (w http.ResponseWriter, req *http.Request) {

	conn, err := bdb.SqlConnection()
	if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	rows, err := conn.Query("SELECT name, last_updated, last_checked FROM search_types")
	if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer rows.Close()

	var (
		source string
		update time.Time
		checked time.Time
	)
	sources := make([]dataSource, 0)
	for rows.Next() {
		err := rows.Scan(&source, &update, &checked)
		if err != nil {
			log.Println(err)
			renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
			return
		}

		sources = append(sources, dataSource{source, update, checked, "READY"})
	}

	renderJSON(w, req, http.StatusOK, map[string][]dataSource{"result": sources})
}