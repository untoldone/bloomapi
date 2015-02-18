package api

import (
	"github.com/gocodo/bloomdb"
)

var bloomConn *bloomdb.BloomDatabase

func Conn() *bloomdb.BloomDatabase {
	if bloomConn == nil {
		bloomConn = bloomdb.CreateDB()
	}

	return bloomConn
}