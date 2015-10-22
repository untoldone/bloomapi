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