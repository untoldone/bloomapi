package bloomapi

import (
	"net/http"
	"log"
)

func phraseMatches (phrases map[string]string) []interface{} {
	elasticPhrases := make([]interface{}, 0)
	for key, value := range phrases {
		elasticPhrases = append(elasticPhrases, map[string]interface{} {
				"match_phrase": map[string]interface{} {
					key: value,
				},
			})
	}

	return elasticPhrases
}

func SearchHandler (w http.ResponseWriter, req *http.Request) {
	params, err := parseParams(req.URL.Query())
	if err != nil {
		renderJSON(w, req, http.StatusBadRequest, err)
		return
	}

	results, err := search("npi", params)
	if err != nil {
		log.Println(err)
		renderJSON(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	
	renderJSON(w, req, http.StatusOK, results)
	return
}