package bloomapi

import (
	"io/ioutil"
	"log"
	"github.com/untoldone/bloomdb"
)

func Bootstrap() {
	bdb := bloomdb.CreateDB()

	conn, err := bdb.SqlConnection()
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	file, err := ioutil.ReadFile("bootstrap.sql")
	if err != nil {
		log.Fatal(err)
	}

	query := string(file[:])

	_, err = conn.Exec(query)
	if err != nil {
		log.Fatal(err)
	}
}