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
		r.JSON(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	rows, err := conn.Query("SELECT source, updated, checked, status FROM data_sources")
	if err != nil {
		log.Println(err)
		r.JSON(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer rows.Close()

	var (
		source string
		update time.Time
		checked time.Time
		status string
	)
	sources := make([]dataSource, 0)
	for rows.Next() {
		err := rows.Scan(&source, &update, &checked, &status)
		if err != nil {
			log.Println(err)
			r.JSON(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}

		sources = append(sources, dataSource{source, update, checked, status})
	}

	r.JSON(w, http.StatusOK, map[string][]dataSource{"result": sources})
}