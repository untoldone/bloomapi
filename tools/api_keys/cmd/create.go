package cmd

import (
	"fmt"
	"time"
	"math/rand"
	"github.com/gocodo/bloomdb"
)

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")

func randSeq(n int) string {
	rand.Seed(time.Now().UTC().UnixNano())
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func Create() error {
	key := randSeq(32)

	bdb := bloomdb.CreateDB()
	conn, err := bdb.SqlConnection()
	if err != nil {
		return err
	}

	createdAt := time.Now().UTC()
	key_id := bloomdb.MakeKey(key)

	_, err = conn.Exec("INSERT INTO api_keys (id, key, created_at) VALUES ($1, $2, $3)", key_id, key, createdAt)
	if err != nil {
		return err
	}

	fmt.Printf("Created Key '%s' at '%s'\n", key, createdAt.String())

	return nil
}