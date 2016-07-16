package handler

import (
	"net/http"
	"net/url"
	"io/ioutil"
	"errors"
	"log"
	"strconv"
	"encoding/json"
	"strings"
	"github.com/gorilla/context"
	"github.com/spf13/viper"
	"github.com/untoldone/bloomapi/api"
	"github.com/satori/go.uuid"
)

func YourChartCreateHandler (w http.ResponseWriter, req *http.Request) {
	yourchartUrl := viper.GetString("yourchartUrl")
	//yourchartLabUrl := viper.GetString("yourchartLabUrl")
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

	jobId := uuid.NewV4().String()

	// Yourchart
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

	var decoded map[string]interface{}
	decoder := json.NewDecoder(strings.NewReader(string(body)))
	err = decoder.Decode(&decoded)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var upstreamJobId string
	rawUpstreamJobId, ok := decoded["statusId"]
	if !ok {
		log.Println(errors.New("Unable to get new job's statusId"))
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	// Yourchart Lab!!
	/*postLabResp, err := http.PostForm(yourchartLabUrl, url.Values{
			"username": {username},
			"password": {password},
			"orgId": {orgId},
		})
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer postLabResp.Body.Close()
	labBody, err := ioutil.ReadAll(postLabResp.Body)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var labDecoded map[string]interface{}
	labDecoder := json.NewDecoder(strings.NewReader(string(labBody)))
	err = labDecoder.Decode(&labDecoded)
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var upstreamLabJobId string
	rawUpstreamLabJobId, ok := labDecoded["statusId"]
	if !ok {
		log.Println(errors.New("Unable to get new job's statusId"))
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	switch rawUpstreamLabJobId := rawUpstreamLabJobId.(type) {
	case string:
		upstreamLabJobId = rawUpstreamLabJobId
	case float64:
		upstreamLabJobId = strconv.FormatFloat(rawUpstreamLabJobId, 'f', 0, 64)
	}*/

	switch rawUpstreamJobId := rawUpstreamJobId.(type) {
	case string:
		upstreamJobId = rawUpstreamJobId
	case float64:
		upstreamJobId = strconv.FormatFloat(rawUpstreamJobId, 'f', 0, 64)
	}

	err = YourchartAuthorize(apiKey, jobId, upstreamJobId, "")
	if err != nil {
		log.Println(err)
		api.Render(w, req, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	api.AddFeature(req, "handler:yourchart:create")

	api.Render(w, req, http.StatusOK, map[string]string{
	    "statusId": jobId,
		})
}