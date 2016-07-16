package bloomdb

import (
	"database/sql"
)

func CreateIndex(db *sql.DB, table string, column string) error {
	if _, err := db.Exec("CREATE INDEX ON %s (%s)", table, column); err != nil {
		return err
	}

	return nil
}