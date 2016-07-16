package bloomdb

import (
	"bytes"
	"database/sql"
	"github.com/lib/pq"
	"text/template"
	"time"
	"log"
)

type syncInfo struct {
	Table   string
	Columns []string
	CreatedAt string
	UpdatedAt string
}

func buildSyncQuery(table string, columns []string, now string) (string, error) {
	buf := new(bytes.Buffer)
	t, err := template.New("sync.sql.template").Funcs(fns).Parse(syncSql)
	if err != nil {
		return "", err
	}
	info := syncInfo{table, columns, now, now}
	err = t.Execute(buf, info)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func Sync(db *sql.DB, table string, columns []string, rows chan []string) error {
	now := time.Now().UTC().Format(time.RFC3339)
	query, err := buildSyncQuery(table, columns, now)
	if err != nil {
		return err
	}

	_, err = db.Exec("DROP TABLE IF EXISTS " + table + "_temp;")
	if err != nil {
		return err
	}

	txn, err := db.Begin()
	if err != nil {
		return err
	}

	_, err = txn.Exec("CREATE TABLE " + table + "_temp(LIKE " + table + ");")
	if err != nil {
		return err
	}

	columns = append([]string{ "bloom_created_at"}, columns...)

	stmt, err := txn.Prepare(pq.CopyIn(table + "_temp", columns...))
	if err != nil {
		return err
	}

	for rawRow := range rows {
		row := make([]interface{}, len(rawRow) + 1)
		row[0] = now
		for i, column := range rawRow {
			if column == "" {
				row[i + 1] = nil
			} else {
				row[i + 1] = column
			}
		}

		_, err = stmt.Exec(row...)
		if err != nil {
			log.Println("table", table, "row", row)
			return err
		}
	}

	_, err = stmt.Exec()
	if err != nil {
		return err
	}

	err = txn.Commit()
	if err != nil {
		return err
	}

	log.Println("Delete Duplicates")

	_, err = db.Exec(`
CREATE TABLE ` + table + `_dedup
AS SELECT DISTINCT * FROM ` + table + `_temp;
DROP TABLE ` + table + `_temp;
ALTER TABLE ` + table + `_dedup
RENAME TO ` + table + `_temp;`)
	if err != nil {
		return err
	}

	log.Println("Creating Indexes")

	_, err = db.Exec("CREATE INDEX ON " + table + "_temp (id); CREATE INDEX ON " + table + "_temp (revision);")
	if err != nil {
		return err
	}

	log.Println("Anayzing")

	_, err = db.Exec("ANALYZE " + table + "_temp (id, revision)")
	if err != nil {
		return err
	}

	_, err = db.Exec("ANALYZE " + table + " (id, revision)")
	if err != nil {
		return err
	}

	log.Println("Running Sync Query")

	_, err = db.Exec(query)
	if err != nil {
		return err
	}

	log.Println("Add indexes to temp")

	// NOTE: this currently only supports single column, btree indexes
	indexRows, err := db.Query(`SELECT pg_get_indexdef(idx.indexrelid, 1, true)
FROM   pg_index as idx
WHERE  indrelid = '` + table + `'::regclass`)
	if err != nil {
		return err
	}
	defer indexRows.Close()

	reindexQuery := ""
	for indexRows.Next() {
		var column string
		if err := indexRows.Scan(&column); err != nil {
			return err
		}
		if column != "id" && column != "revision" {
			reindexQuery += "CREATE INDEX ON " + table + "_temp (" + column + ");\n"
		}
	}
	if err := indexRows.Err(); err != nil {
		return err
	}

	_, err = db.Exec(reindexQuery)
	if err != nil {
		return err
	}

	log.Println("Swap temp table for real")

	_, err = db.Exec(`DROP TABLE ` + table + `;
ALTER TABLE ` + table + `_temp
RENAME TO ` + table + `;`)
	if err != nil {
		return err
	}

	return nil
}
