--- Currently Upsert does not Delete
--- records from tables that have 'foreign key' relationships to some other parent
--- table. This is important if say, a foreign table has deleted records
--- despite the parent entry not being updated/ deleted.
--- templatized steps 2 and 3 of this demo should be added to
--- upsert_sql to fix this issue

--- Demo To "Update, Delete, Leave Same, Append"

--- Data one:
DROP TABLE IF EXISTS one;
DROP TABLE IF EXISTS one_temp;
DROP TABLE IF EXISTS one_revisions;

CREATE TABLE one (
  id int,
  revision int,
  foreign_id int,
  created_at timestamp
);

INSERT INTO one VALUES (1, 1, 10, '2015-01-01');
INSERT INTO one VALUES (2, 2, 11, '2015-01-01');
INSERT INTO one VALUES (3, 3, 12, '2015-01-01');
INSERT INTO one VALUES (5, 5, 13, '2015-01-01');

--- Data one_temp:

CREATE TABLE one_temp (
  id int,
  revision int,
  foreign_id int,
  created_at timestamp
);

--- Version Table

CREATE TABLE one_revisions (
  id int,
  revision int,
  foreign_id int,
  created_at timestamp,
  updated_at timestamp,
  action varchar(255)
);

--- 1) LOAD TEMP TABLE
INSERT INTO one_temp VALUES (1, 5, 10, '2015-01-02');
INSERT INTO one_temp VALUES (3, 3, 12, '2015-01-02');
INSERT INTO one_temp VALUES (4, 4, 11, '2015-01-02');

--- RESULT SHOULD BE
--- 1, 5
--- 3, 3
--- 4, 4
--- 5, 5

--- VERSION TABLE SHOULD BE
--- 2, 2, Deleted
--- 1, 1, Updated

--- 2) Move Main Table - Temp Table into version table
INSERT INTO one_revisions (id, revision, foreign_id, created_at, action, updated_at)
  SELECT one.id, one.revision, one.foreign_id, one.created_at, 'DELETE' AS action, '2015-01-02' AS updated_at
  FROM one
  WHERE EXISTS (
    SELECT * FROM (
      SELECT id FROM (
        SELECT *
        FROM one
        WHERE EXISTS (
          SELECT 1
          FROM one_temp
          WHERE one_temp.foreign_id = one.foreign_id)) AS j
      EXCEPT
      SELECT id from one_temp) AS f
   WHERE f.id = one.id);

--- 3) Delete Main Table - Temp Table from Main Table
DELETE FROM one
WHERE EXISTS (
    SELECT * FROM (
      SELECT id FROM (
        SELECT *
        FROM one
        WHERE EXISTS (
          SELECT 1
          FROM one_temp
          WHERE one_temp.foreign_id = one.foreign_id)) AS j
      EXCEPT
      SELECT id from one_temp) AS f
   WHERE f.id = one.id);

--- 4) Move Main Table INTERSECT Temp Table into version table
INSERT INTO one_revisions (id, revision, foreign_id, created_at, action, updated_at)
  (SELECT one.id, one.revision, one.foreign_id, one.created_at, 'UPDATE' AS action, '2015-01-02' AS updated_at
  FROM one
  WHERE EXISTS(
    SELECT 1
    FROM one_temp
    WHERE one_temp.id = one.id
    AND one_temp.revision != one.revision));

--- 5) Update Main Table from Temp Table
UPDATE one
SET id = one_temp.id,
revision = one_temp.revision,
foreign_id = one_temp.foreign_id,
created_at = one_temp.created_at
FROM one_temp
WHERE EXISTS(
    SELECT *
    FROM one_temp
    WHERE one_temp.id = one.id
    AND one_temp.revision != one.revision);

--- 6) Insert New records into Main Table
INSERT INTO one
SELECT one_temp.*
FROM one_temp 
WHERE EXISTS (
  SELECT * FROM (
    SELECT id FROM one_temp
    EXCEPT
    SELECT id from one) AS f
  WHERE f.id = one_temp.id);

