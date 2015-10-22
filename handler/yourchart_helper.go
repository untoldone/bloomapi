package handler

import (
	"time"
	"github.com/untoldone/bloomapi/api"
	"github.com/gocodo/bloomdb"
)

func YourchartEnabled(apiKey string) (bool, error) {
	conn, err := api.Conn().SqlConnection()
	if err != nil {
		return false, err
	}

	rows, err := conn.Query(`
		SELECT COUNT(*)
		FROM yourchart_keys
		JOIN api_keys
		ON api_keys.id = yourchart_keys.api_key_id
		WHERE api_keys.key = $1
		`, apiKey)
	if err != nil {
		return false, err
	}
	defer rows.Close()

	var count int
	for rows.Next() {
		if err := rows.Scan(&count); err != nil {
			return false, err
		}
	}

	if err = rows.Err(); err != nil {
		return false, err
	}

	return count > 0, nil
}

func YourchartAuthorized(apiKey string, jobId string) (string, string, error) {
	conn, err := api.Conn().SqlConnection()
	if err != nil {
		return "", "", err
	}

	rows, err := conn.Query(`
		SELECT upstream_job_id, upstream_lab_job_id
		FROM yourchart_job_authorizations
		JOIN api_keys
		ON api_keys.id = yourchart_job_authorizations.api_key_id
		WHERE api_keys.key = $1
		AND job_id = $2
		`, apiKey, jobId)
	if err != nil {
		return "", "", err
	}
	defer rows.Close()

	var upstreamJobId string
	var upstreamLabJobId string
	for rows.Next() {
		if err := rows.Scan(&upstreamJobId, &upstreamLabJobId); err != nil {
			return "", "", err
		}
	}

	if err = rows.Err(); err != nil {
		return "", "", err
	}

	return upstreamJobId, upstreamLabJobId, nil
}

func YourchartAuthorize(apiKey string, jobId string, upstreamJobId string, upstreamLabJobId string) error {
	conn, err := api.Conn().SqlConnection()
	if err != nil {
		return err
	}

	authorizationId := bloomdb.MakeKey(apiKey, jobId)
	createdAt := time.Now().UTC()

	_, err = conn.Exec(`
		INSERT INTO yourchart_job_authorizations (id, api_key_id, job_id, upstream_job_id, upstream_lab_job_id, created_at)
		VALUES ($1, 
			(SELECT id FROM api_keys WHERE key = $2), 
			$3, $4, $5, $6)`, authorizationId, apiKey, jobId, upstreamJobId, upstreamLabJobId, createdAt)
	if err != nil {
		return err
	}

	return nil
}