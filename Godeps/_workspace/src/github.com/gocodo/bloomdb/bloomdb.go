package bloomdb

import (
	"database/sql"
	"github.com/spf13/viper"
	elastigo "github.com/mattbaird/elastigo/lib"
)

type BloomDatabase struct {
	sqlConnStr string
	searchHosts []string
	sharedSearch *elastigo.Conn
	sharedDB *sql.DB
}

func (bdb *BloomDatabase) SqlConnection() (*sql.DB, error) {
	if bdb.sharedDB == nil {
		db, err := sql.Open("postgres", bdb.sqlConnStr)
		if err != nil {
			return nil, err
		}
		bdb.sharedDB = db
	}

	return bdb.sharedDB, nil
}

func (bdb *BloomDatabase) SearchConnection() (*elastigo.Conn) {
	if bdb.sharedSearch == nil {
		conn := elastigo.NewConn()
		conn.SetHosts(bdb.searchHosts)
		bdb.sharedSearch = conn
	}

	return bdb.sharedSearch
}

func CreateDB () *BloomDatabase {
	return &BloomDatabase {
		viper.GetString("sqlConnStr"),
		viper.GetStringSlice("searchHosts"),
		nil,
		nil,
	}
}
