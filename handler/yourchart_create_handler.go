package handler

import (
	"net/http"
	"net/url"
	"io/ioutil"
	"errors"
	"log"
	"encoding/json"
	"strings"
	"github.com/gorilla/context"
	"github.com/spf13/viper"
	"github.com/untoldone/bloomapi/api"

	"fmt"
)

func YourChartCreateHandler (w http.ResponseWriter, req *http.Request) {
	yourchartUrl := viper.GetString("yourchartUrl")
	username := req.FormValue("username")
	password := req.FormValue("password")
	orgId := req.FormValue("orgId")

	apiKey, ok := context.Get(req, "api_key").(string)
	
	enabled, err := YourchartEnabled(apiKey)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if (!ok || !enabled) {
		api.Render(w, req, 404, map[string]string{
			"name": "Source Not Found",
			"message": "Please contact support@bloomapi.com if this is in error",
		})
		return
	}

	api.AddFeature(req, "handler:yourchart:create")

	postResp, err := http.PostForm(yourchartUrl, url.Values{
			"username": {username},
			"password": {password},
			"orgId": {orgId},
		})
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer postResp.Body.Close()
	body, err := ioutil.ReadAll(postResp.Body)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var decoded map[string]int
	decoder := json.NewDecoder(strings.NewReader(string(body)))
	err = decoder.Decode(&decoded)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	jobId, ok := decoded["statusId"]
	if !ok {
		log.Println(errors.New("Unable to get new job's statusId"))
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	fmt.Println(jobId)

	err = YourchartAuthorize(apiKey, jobId)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	api.Render(w, req, http.StatusOK, decoded)
}