package cmd

import (
	"fmt"
	"errors"
	"github.com/gocodo/bloomdb"
)

func RevokeYourchart(key string) error {
	bdb := bloomdb.CreateDB()
	conn, err := bdb.SqlConnection()
	if err != nil {
		return err
	}

	result, err := conn.Exec(`DELETE FROM yourchart_keys 
		USING api_keys 
		WHERE api_keys.key = $1
		AND api_keys.id = yourchart_keys.api_key_id`, key)
	if err != nil {
		return err
	}

	rCount, err := result.RowsAffected()
	if err != nil {
		return err
	} else if rCount < 1 {
		return errors.New("Unable to find key")
	} else {
		fmt.Println("Revoked")
	}

	return nil
}