package handler

import (
	"net/http"
	"io/ioutil"
	"log"
	"encoding/json"
	"strings"
	"strconv"
	"github.com/gorilla/mux"
	"github.com/gorilla/context"
	"github.com/spf13/viper"
	"github.com/untoldone/bloomapi/api"
)

func YourChartFetchHandler (w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	yourchartUrl := viper.GetString("yourchartUrl")
	id := vars["id"]

	parsedId, err := strconv.Atoi(id)
	if err != nil {
		api.Render(w, req, http.StatusBadRequest, api.NewParamsError("job id must be a number", map[string]string{}))
	}

	apiKey, ok := context.Get(req, "api_key").(string)
	
	enabled, err := YourchartEnabled(apiKey)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	authorized, err := YourchartAuthorized(apiKey, parsedId)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if (!ok || !enabled || !authorized) {
		api.Render(w, req, 404, map[string]string{
			"name": "Source Not Found",
			"message": "Please contact support@bloomapi.com if this is in error",
		})
		return
	}

	getResp, err := http.Get(yourchartUrl + "/" + id)
	body, err := ioutil.ReadAll(getResp.Body)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var decoded map[string]interface{}
	decoder := json.NewDecoder(strings.NewReader(string(body)))
	err = decoder.Decode(&decoded)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	api.AddFeature(req, "handler:yourchart:fetch")

	api.Render(w, req, http.StatusOK, decoded)
}