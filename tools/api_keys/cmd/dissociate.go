package cmd

import (
	"fmt"
	"errors"
	"github.com/gocodo/bloomdb"
)

func Dissociate(key string, searchType string) error {
	bdb := bloomdb.CreateDB()
	conn, err := bdb.SqlConnection()
	if err != nil {
		return err
	}

	result, err := conn.Exec(`DELETE FROM keys_to_search_types 
		USING search_types, api_keys 
		WHERE api_keys.key = $1
		AND search_types.name = $2
		AND api_keys.id = keys_to_search_types.api_key_id
		AND search_types.id = keys_to_search_types.search_type_id`, key, searchType)
	if err != nil {
		return err
	}

	rCount, err := result.RowsAffected()
	if err != nil {
		return err
	} else if rCount < 1 {
		return errors.New("Unable to find key or search type")
	} else {
		fmt.Println("Dissociated")
	}

	return nil
}