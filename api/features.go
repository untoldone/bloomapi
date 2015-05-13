package api

import (
	"time"
	"net/http"
	"github.com/gorilla/context"
)

func AddFeature(r *http.Request, feature string) {
	rawFeatures, ok := context.GetOk(r, "features")

	if ok {
		features := rawFeatures.(map[string]int)
		features[feature] += 1
	} else {
		context.Set(r, "features", map[string]int{ feature: 1 })
	}
}

func GetFeatures(r *http.Request) map[string]interface{} {
	result := map[string]interface{} {}

	if features, ok := context.GetOk(r, "features"); ok {
		result["features"] = features
	}

	if identifier, ok := context.GetOk(r, "api_key"); ok {
		result["identifier"] = identifier
	}

	result["timestamp"] = time.Now().UTC().Format(time.RFC3339Nano)

	return result
}