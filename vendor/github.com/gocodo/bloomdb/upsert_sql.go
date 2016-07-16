package bloomdb

var upsertSql = `
{{if ne .ParentKey ""}}
  --- 1) Move Main Table - Temp Table (using Parent Key to limit) into version table
  INSERT INTO {{.Table}}_revisions (
    {{range $i, $e := .Columns}}{{$e}},{{end}}
    bloom_created_at,
    bloom_updated_at,
    bloom_action
    )
    SELECT 
    {{range $i, $e := .Columns}}{{$e}},{{end}}
    bloom_created_at,
    '{{.UpdatedAt}}' AS bloom_updated_at,
    'DELETE' AS bloom_action
    FROM {{.Table}}
    WHERE EXISTS (
      SELECT 1 FROM (
        SELECT id FROM (
          SELECT *
          FROM {{.Table}}
          WHERE EXISTS (
            SELECT 1
            FROM {{.Table}}_temp
            WHERE {{.Table}}_temp.{{.ParentKey}} = {{.Table}}.{{.ParentKey}})) AS j
        EXCEPT
        SELECT id from {{.Table}}_temp) AS f
     WHERE f.id = {{.Table}}.id);

  --- 2) Delete Main Table - Temp Table (using Parent Key to limit) from Main Table
  DELETE FROM {{.Table}}
  WHERE EXISTS (
      SELECT 1 FROM (
        SELECT id FROM (
          SELECT *
          FROM {{.Table}}
          WHERE EXISTS (
            SELECT 1
            FROM {{.Table}}_temp
            WHERE {{.Table}}_temp.{{.ParentKey}} = {{.Table}}.{{.ParentKey}})) AS j
        EXCEPT
        SELECT id from {{.Table}}_temp) AS f
     WHERE f.id = {{.Table}}.id);
{{end}}

--- 3) INSERT Main Table INTERSECT Temp Table into version table (to be updated)
INSERT INTO {{.Table}}_revisions (
	{{range $i, $e := .Columns}}{{$e}},{{end}}
	bloom_created_at,
	bloom_updated_at,
	bloom_action
	)
  (SELECT 
  	{{range $i, $e := .Columns}}{{$e}},{{end}}
		bloom_created_at,
		'{{.UpdatedAt}}' AS bloom_updated_at,
		'UPDATE' AS bloom_action
  FROM {{.Table}}
  WHERE EXISTS(
    SELECT 1
    FROM {{.Table}}_temp
    WHERE {{.Table}}_temp.id = {{.Table}}.id
    AND {{.Table}}_temp.revision != {{.Table}}.revision));

--- 4) Update Main Table from Temp Table
UPDATE {{.Table}}
SET
{{range $i, $e := .Columns}}{{$e}} = {{$.Table}}_temp.{{$e}},{{end}}
bloom_created_at = '{{.CreatedAt}}'
FROM {{.Table}}_temp
WHERE {{.Table}}_temp.id = {{.Table}}.id
AND EXISTS(
    SELECT 1
    FROM {{.Table}}_temp
    WHERE {{.Table}}_temp.id = {{.Table}}.id
    AND {{.Table}}_temp.revision != {{.Table}}.revision);

--- 5) Insert New records into Main Table
INSERT INTO {{.Table}} (
{{range $i, $e := .Columns}}{{$e}},{{end}}
bloom_created_at
)
SELECT DISTINCT ON ({{.Table}}_temp.id)
{{range $i, $e := .Columns}}{{$e}},{{end}}
'{{.CreatedAt}}' AS bloom_created_at
FROM {{.Table}}_temp 
WHERE EXISTS (
  SELECT 1 FROM (
    SELECT id FROM {{.Table}}_temp
    EXCEPT
    SELECT id FROM {{.Table}}) AS f
  WHERE f.id = {{.Table}}_temp.id);
`