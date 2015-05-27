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
