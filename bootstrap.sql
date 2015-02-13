CREATE TABLE sources
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
  CONSTRAINT search_types_id_key UNIQUE (id)
);