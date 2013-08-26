CREATE TYPE source_status
AS ENUM     ('READY', 'RUNNING', 'NEVER_RUN');

CREATE TABLE data_sources (
  source  varchar(20) NOT NULL UNIQUE,
  updated timestamp,
  checked timestamp,
  status  source_status 
);

CREATE TABLE npi_files (
  name    varchar(75) NOT NULL UNIQUE
);

CREATE TABLE npis (
  npi     bigint PRIMARY KEY
);

INSERT INTO data_sources
VALUES ('NPI', NULL, NULL, 'NEVER_RUN');

