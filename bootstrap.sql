DROP TABLE IF EXISTS data_sources;

CREATE TABLE data_sources
(
  source character varying(50) NOT NULL,
  updated timestamp without time zone,
  checked timestamp without time zone,
  status character varying(50),
  CONSTRAINT data_sources_source_key UNIQUE (source)
)