package cmd

import (
	"time"
	"fmt"
	"errors"
	"database/sql"
	"github.com/gocodo/bloomdb"
)

func Associate(key string, searchType string) error {
	bdb := bloomdb.CreateDB()
	conn, err := bdb.SqlConnection()
	if err != nil {
		return err
	}

	var apiKeyId, searchTypeId string

	err = conn.QueryRow("SELECT id FROM api_keys where key = $1", key).Scan(&apiKeyId)
	if err == sql.ErrNoRows {
		return errors.New("Api Key not found")
	} else if err != nil {
		return err
	}

	err = conn.QueryRow("SELECT id FROM search_types where name = $1", searchType).Scan(&searchTypeId)
	if err == sql.ErrNoRows {
		return errors.New("Search Type not found")
	} else if err != nil {
		return err
	}

	createdAt := time.Now().UTC()
	id := bloomdb.MakeKey(apiKeyId, searchTypeId)

	_, err = conn.Exec("INSERT INTO keys_to_search_types (id, api_key_id, search_type_id, created_at) VALUES ($1, $2, $3, $4)", id, apiKeyId, searchTypeId, createdAt)
	if err != nil {
		return err
	}

	fmt.Printf("Associated key to search type at '%s'\n", createdAt.String())

	return nil
}