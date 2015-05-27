package cmd

import (
	"time"
	"fmt"
	"errors"
	"database/sql"
	"github.com/gocodo/bloomdb"
)

func GrantYourchart(key string) error {
	bdb := bloomdb.CreateDB()
	conn, err := bdb.SqlConnection()
	if err != nil {
		return err
	}

	var apiKeyId string

	err = conn.QueryRow("SELECT id FROM api_keys where key = $1", key).Scan(&apiKeyId)
	if err == sql.ErrNoRows {
		return errors.New("Api Key not found")
	} else if err != nil {
		return err
	}

	createdAt := time.Now().UTC()

	_, err = conn.Exec("INSERT INTO yourchart_keys (id, api_key_id, created_at) VALUES ($1, $1, $2)", apiKeyId, createdAt)
	if err != nil {
		return err
	}

	fmt.Printf("Granted Yourchart at '%s'\n", createdAt.String())

	return nil
}