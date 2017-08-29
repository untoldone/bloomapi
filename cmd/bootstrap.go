package cmd

import (
	"log"
	"github.com/gocodo/bloomdb"
)

func Bootstrap() {
	bdb := bloomdb.CreateDB()

	conn, err := bdb.SqlConnection()
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	_, err = conn.Exec(bootstrapSql)
	if err != nil {
		log.Fatal(err)
	}
}

var bootstrapSql =
`CREATE TABLE sources
(
  id uuid,
  name character varying(255),
  checked timestamp,
  CONSTRAINT sources_id_key UNIQUE (id)
);

CREATE TABLE source_tables
(
  id uuid,
  source_id uuid,
  name character varying(64),
  CONSTRAINT source_tables_id_key UNIQUE (id)
);
CREATE INDEX ON source_tables (source_id);

CREATE TABLE source_versions
(
  id uuid,
  source_id uuid,
  version character varying(255),
  CONSTRAINT source_versions_id_key UNIQUE (id)
);
CREATE INDEX ON source_versions (source_id);

CREATE TABLE search_types
(
  id uuid,
  name character varying(255),
  last_updated timestamp,
  last_checked timestamp,
  public boolean,
  CONSTRAINT search_types_id_key UNIQUE (id)
);

CREATE TABLE api_keys
(
  id uuid,
  account_id uuid,
  key character varying(32),
  deactivated boolean DEFAULT false,
  updated_at timestamp,
  created_at timestamp,
  CONSTRAINT api_keys_id_key UNIQUE (id)
);

CREATE TABLE keys_to_search_types
(
  id uuid,
  api_key_id uuid,
  search_type_id uuid,
  created_at timestamp,
  CONSTRAINT keys_to_search_types_id_key UNIQUE (id)
);

CREATE TABLE yourchart_keys
(
  id uuid,
  api_key_id uuid,
  created_at timestamp,
  CONSTRAINT yourchart_keys_id_key UNIQUE (id)
);

CREATE TABLE yourchart_job_authorizations
(
  id uuid,
  api_key_id uuid,
  job_id int,
  created_at timestamp,
  CONSTRAINT yourchart_job_authorizations_id_key UNIQUE (id)
);

ALTER TABLE yourchart_job_authorizations
  RENAME COLUMN job_id TO upstream_job_id;

ALTER TABLE yourchart_job_authorizations
  ALTER COLUMN upstream_job_id TYPE varchar(64),
  ADD COLUMN job_id varchar(64),
  ADD COLUMN upstream_lab_job_id varchar(64);

UPDATE yourchart_job_authorizations SET job_id = upstream_job_id;
`