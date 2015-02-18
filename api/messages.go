package api

import (
	"net/http"
	"github.com/gorilla/context"
)

func AddMessage(r *http.Request, message string) {
	rawMessages, ok := context.GetOk(r, "messages")

	if ok {
		messages := rawMessages.([]string)
		messages = append(messages, message)
		context.Set(r, "messages", messages)
	} else {
		context.Set(r, "messages", []string{ message })
	}
}

func GetMessages(r *http.Request) []string {
	rawMessages, ok := context.GetOk(r, "messages")

	if ok {
		return rawMessages.([]string)
	} else {
		return []string{}
	}
}