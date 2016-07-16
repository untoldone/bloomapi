package bloomdb

import (
	"github.com/go-contrib/uuid"
	"strings"
)

func MakeKey(values ...string) string {
	key := "[" + strings.Join(values, "][") + "]"
	return uuid.NewV3(uuid.NamespaceOID, key).String()
}