package handler

import (
	"net/http"
	"io/ioutil"
	"log"
	"errors"
	"encoding/json"
	"strings"
	"github.com/gorilla/mux"
	"github.com/gorilla/context"
	"github.com/spf13/viper"
	"github.com/untoldone/bloomapi/api"
	raven "github.com/getsentry/raven-go"
)

func YourChartFetchHandler (w http.ResponseWriter, req *http.Request) {
	raven.SetHttpContext(raven.NewHttp(req))
	vars := mux.Vars(req)
	yourchartUrl := viper.GetString("yourchartUrl")
	yourchartLabUrl := viper.GetString("yourchartLabUrl")
	id := vars["id"]

	apiKey, ok := context.Get(req, "api_key").(string)
	
	enabled, err := YourchartEnabled(apiKey)
	if err != nil {
		log.Println(err)
		raven.CaptureErrorAndWait(err, nil)
		api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
		return
	}

	upstreamJobId, upstreamLabJobId, err := YourchartAuthorized(apiKey, id)
	if err != nil {
		log.Println(err)
		raven.CaptureErrorAndWait(err, nil)
		api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
		return
	}

	if (!ok || !enabled || upstreamJobId == "") {
		api.Render(w, req, 404, map[string]string{
			"name": "Source Not Found",
			"message": "Please contact support@bloomapi.com if this is in error",
		})
		return
	}

	getResp, err := http.Get(yourchartUrl + "/" + upstreamJobId)
	body, err := ioutil.ReadAll(getResp.Body)
	if err != nil {
		log.Println(err)
		raven.CaptureErrorAndWait(err, nil)
		api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
		return
	}

	var decoded map[string]interface{}
	decoder := json.NewDecoder(strings.NewReader(string(body)))
	err = decoder.Decode(&decoded)
	if err != nil {
		log.Println(err)
		raven.CaptureErrorAndWait(err, nil)
		api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
		return
	}

	api.AddFeature(req, "handler:yourchart:fetch")

	if upstreamLabJobId == "" {
		api.Render(w, req, http.StatusOK, decoded)
		return
	}

	getLabResp, err := http.Get(yourchartLabUrl + "/" + upstreamLabJobId)
	labBody, err := ioutil.ReadAll(getLabResp.Body)
	if err != nil {
		log.Println(err)
		raven.CaptureErrorAndWait(err, nil)
		api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
		return
	}

	var labDecoded map[string]interface{}
	labDecoder := json.NewDecoder(strings.NewReader(string(labBody)))
	err = labDecoder.Decode(&labDecoded)
	if err != nil {
		log.Println(err)
		raven.CaptureErrorAndWait(err, nil)
		api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
		return
	}
	
	state, ok := decoded["state"].(string)
	if !ok {
		api.Render(w, req, 404, map[string]string{
			"name": "Source Not Found",
			"message": "Please contact support@bloomapi.com if this is in error",
		})
		return
	}

	if state != "complete" {
		api.Render(w, req, http.StatusOK, decoded)
		return
	}

	labState, ok := labDecoded["state"].(string)
	if !ok {
		api.Render(w, req, 404, map[string]string{
			"name": "Source Not Found",
			"message": "Please contact support@bloomapi.com if this is in error",
		})
		return
	}

	if labState != "complete" {
		api.Render(w, req, http.StatusOK, map[string]string{"state": "authenticated"})
		return
	}

	patients := decoded["result"].(map[string]interface{})["patients"].([]interface{})

	for iOne, patient := range patients {
		//name := patient.(map[string]interface{})["name"].(string)
		details := patient.(map[string]interface{})["details"]
		replaced := false

		labPatients := labDecoded["result"].(map[string]interface{})["patients"].([]interface{})
		if len(patients) != len(labPatients) {
			raven.CaptureErrorAndWait(errors.New("number of patients are different"), nil)
			api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
			return
		}

		if labPatients[0].(map[string]interface{})["test-results"] != nil {
			// New version Jan 25, 2016
			for iTwo, labPatient := range labPatients {
				//labName := labPatient.(map[string]interface{})["name"].(string)
				//labDetails := labPatient.(map[string]interface{})["details"]

				if iOne == iTwo {
					if labPatient.(map[string]interface{})["name"] != nil && 
							patient.(map[string]interface{})["name"] != labPatient.(map[string]interface{})["name"] {
						raven.CaptureErrorAndWait(errors.New("multiple patients inproperly matched"), nil)
						api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
						return
					}

					if details != nil {
						details.(map[string]interface{})["test-results"] = labPatient.(map[string]interface{})["test-results"]
					}
					
					replaced = true
					break
				}
			}
		} else {
			// Previous version
			details.(map[string]interface{})["test-results"] = labDecoded["result"].(map[string]interface{})["patients"]
			replaced = true
		}

		if !replaced {
			log.Println("Failed to match Epic lab service patient to mobile patient")
			raven.CaptureErrorAndWait(errors.New("Failed to match Epic lab service patient to mobile patient"), nil)
			api.Render(w, req, http.StatusOK, map[string]string{"state": "failed", "message":"Interal Error"})
			return
		}
	}

	api.Render(w, req, http.StatusOK, decoded)
}