package cmd

import (
	"log"
	"github.com/gocodo/bloomdb"
)

func Drop() {
	bloomdb := bloomdb.CreateDB()

	conn, err := bloomdb.SqlConnection()
	if err != nil {
		log.Fatal("Failed to get database connection.", err)
	}
	defer conn.Close()

	_, err = conn.Exec(dropSql)
	if err != nil {
		log.Fatal("Failed to create metadata tables.", err)
	}
}

var dropSql =
`DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS source_tables;
DROP TABLE IF EXISTS source_versions;
DROP TABLE IF EXISTS search_types;`