package bloomdb

var syncSql = `
--- 1) Move Main Table - Temp Table into version table
INSERT INTO {{.Table}}_revisions (
{{range $i, $e := .Columns}}{{$e}},{{end}}
bloom_created_at,
bloom_updated_at,
bloom_action
)
  (SELECT 
    {{range $i, $e := .Columns}}{{$.Table}}.{{$e}},{{end}}
    '{{.CreatedAt}}' AS bloom_created_at,
    '{{.UpdatedAt}}' AS bloom_updated_at,
    'DELETE' AS bloom_action
  FROM {{.Table}}
  WHERE EXISTS (
    SELECT 1 FROM (
      SELECT id FROM {{.Table}}
      EXCEPT
      SELECT id from {{.Table}}_temp) AS f
    WHERE f.id = {{.Table}}.id));

--- 2) Delete Main Table - Temp Table from Main Table
---DELETE FROM {{.Table}}
---WHERE EXISTS (
---  SELECT 1 FROM (
---    SELECT id FROM {{.Table}}
---    EXCEPT
---    SELECT id from {{.Table}}_temp) AS f
---  WHERE f.id = {{.Table}}.id);

--- 3) Move Main Table INTERSECT Temp Table into version table
INSERT INTO {{.Table}}_revisions (
  {{range $i, $e := .Columns}}{{$e}},{{end}}
  bloom_created_at,
  bloom_updated_at,
  bloom_action
  )
  (SELECT
    {{range $i, $e := .Columns}}{{$.Table}}.{{$e}},{{end}}
    {{.Table}}.bloom_created_at,
    '{{.UpdatedAt}}' AS bloom_updated_at,
    'UPDATE' AS action
    FROM {{.Table}}
    WHERE EXISTS (
      SELECT 1 FROM (
        SELECT
        id, revision
        FROM {{.Table}}
        EXCEPT
        SELECT id, revision from {{.Table}}_revisions) AS f
      WHERE f.id = {{.Table}}.id));

--- 4) Update Main Table from Temp Table
---UPDATE {{.Table}}
---SET 
---{{range $i, $e := .Columns}}{{$e}} = {{$.Table}}_temp.{{$e}}{{if len $.Columns | sub 1 | eq $i | not}},{{end}}
---{{end}}
---FROM {{.Table}}_temp
---WHERE {{.Table}}_temp.id = {{.Table}}.id
---AND EXISTS (
---  SELECT 1 FROM (
---    SELECT id, revision FROM {{.Table}}
---    EXCEPT
---    SELECT id, revision FROM {{.Table}}_temp) AS f
---  WHERE f.id = {{.Table}}.id);

--- 5) Insert New records into Main Table
---INSERT INTO {{.Table}} (
---{{range $i, $e := .Columns}}{{$e}},{{end}}
---bloom_created_at
---)
---SELECT DISTINCT ON ({{.Table}}_temp.id)
---{{range $i, $e := .Columns}}{{$.Table}}_temp.{{$e}},{{end}}
---'{{.CreatedAt}}' AS bloom_created_at
---FROM {{.Table}}_temp
---WHERE EXISTS (
---  SELECT 1 FROM (
---    SELECT id FROM {{.Table}}_temp
---    EXCEPT
---    SELECT id FROM {{.Table}}) AS f
---  WHERE f.id = {{.Table}}_temp.id);
`