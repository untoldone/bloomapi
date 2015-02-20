package cmd

import (
	"fmt"
	"errors"
	"github.com/gocodo/bloomdb"
)

func Delete(key string) error {
	bdb := bloomdb.CreateDB()
	conn, err := bdb.SqlConnection()
	if err != nil {
		return err
	}

	result, err := conn.Exec("DELETE FROM api_keys WHERE key = $1", key)
	if err != nil {
		return err
	}

	rCount, err := result.RowsAffected()
	if err != nil {
		return err
	} else if rCount < 1 {
		return errors.New("Unable to find key")
	} else {
		fmt.Println("Key deleted")
	}

	return nil
}