CREATE TABLE api_keys
(
  id uuid,
  key character varying(32),
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

ALTER TABLE search_types ADD COLUMN public boolean;

UPDATE search_types SET public = true;