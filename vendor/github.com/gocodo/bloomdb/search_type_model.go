package bloomdb

import (
	"time"
	"database/sql"
)

type SearchTypeModel struct {
	Name string
	LastUpdated time.Time
	LastChecked time.Time
	Public bool
}

func (bdb *BloomDatabase) PublicSearchTypes() ([]SearchTypeModel, error) {
	var searchTypes []SearchTypeModel
	conn, err := bdb.SqlConnection()
	if err != nil {
		return nil, err
	}

	rows, err := conn.Query(`
			SELECT search_types.name, search_types.last_updated, search_types.last_checked, search_types.public
			FROM search_types
			WHERE search_types.public = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		searchType := SearchTypeModel{}
		if err := rows.Scan(&searchType.Name, &searchType.LastUpdated, &searchType.LastChecked, &searchType.Public); err != nil {
			return nil, err
		}

		searchTypes = append(searchTypes, searchType)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return searchTypes, nil
}

func (bdb *BloomDatabase) SearchTypesWithKey(apiKey string) ([]SearchTypeModel, error) {
	var searchTypes []SearchTypeModel
	conn, err := bdb.SqlConnection()
	if err != nil {
		return nil, err
	}

	rows, err := conn.Query(`
			SELECT search_types.name, search_types.last_updated, search_types.last_checked, search_types.public
			FROM search_types
			LEFT JOIN keys_to_search_types
			ON search_types.id = keys_to_search_types.search_type_id
			LEFT JOIN api_keys
			ON keys_to_search_types.api_key_id = api_keys.id
			WHERE public = true OR key = $1
		`, apiKey)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		searchType := SearchTypeModel{}
		if err := rows.Scan(&searchType.Name, &searchType.LastUpdated, &searchType.LastChecked, &searchType.Public); err != nil {
			return nil, err
		}

		searchTypes = append(searchTypes, searchType)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return searchTypes, nil
}

func (bdb *BloomDatabase) SearchTypeWithNameAndKey(name string, apiKey string) (*SearchTypeModel, bool, error) {
	searchType := SearchTypeModel{}
	conn, err := bdb.SqlConnection()
	if err != nil {
		return nil, false, err
	}

	err = conn.QueryRow(`
			SELECT search_types.name, search_types.last_updated, search_types.last_checked, search_types.public
			FROM search_types
			LEFT JOIN keys_to_search_types
			ON search_types.id = keys_to_search_types.search_type_id
			LEFT JOIN api_keys
			ON keys_to_search_types.api_key_id = api_keys.id
			WHERE (key = $1 OR search_types.public = true) AND search_types.name = $2
		`, apiKey, name).Scan(&searchType.Name, &searchType.LastUpdated, &searchType.LastUpdated, &searchType.Public)
	if err == sql.ErrNoRows {
		return nil, false, nil
	} else if err != nil {
		return nil, false, err
	}
	return &searchType, true, nil
}