package api

import (
	"os"
	"log"
	"io"
	"io/ioutil"
	"log/syslog"
	"github.com/spf13/viper"
)

var statsLogger *log.Logger

func StatsLogger() *log.Logger {
	if statsLogger == nil {
		var statsWriter io.Writer
		
		logStyle := viper.GetString("statsLogger")
		switch logStyle {
		case "syslog":
			statsWriter, _ = syslog.New(syslog.LOG_NOTICE, "bloomapi-stats")
		case "stdout":
			statsWriter = os.Stdout
		default:
			statsWriter = ioutil.Discard
		}

		statsLogger = log.New(statsWriter, "", 0)
	}

	return statsLogger
}