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
		r.JSON(w, http.StatusBadRequest, err)
		return
	}

	results, err := search("npi", params)
	if err != nil {
		log.Println(err)
		r.JSON(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	
	r.JSON(w, http.StatusOK, results)
	return
}