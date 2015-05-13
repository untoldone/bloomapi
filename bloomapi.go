package main

import (
	"os"
	"fmt"
	"log"
	"log/syslog"
	"github.com/spf13/viper"
	"github.com/untoldone/bloomapi/cmd"
)

func showUsage() {
	fmt.Println("Usage: bloomapi <command>")
	fmt.Println("=============================\n")
	fmt.Println("Avaialable commands:")
	fmt.Println("bloomapi server    # run BloomAPI server")
	fmt.Println("bloomapi bootstrap # setup BloomAPI shared schema")
	fmt.Println("bloomapi drop      # remove all BloomAPI shared tables")
}

func main() {
	if (len(os.Args) != 2) {
		fmt.Println("Invalid command usage\n")
		showUsage()
		os.Exit(1)
	}

	arg := os.Args[1]

	viper.SetConfigName("config")
	viper.AddConfigPath("./")
	err := viper.ReadInConfig()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	logStyle := viper.GetString("generalLogger")
	switch logStyle {
	case "syslog":
		logwriter, e := syslog.New(syslog.LOG_NOTICE, "bloomapi")
		if e != nil {
			fmt.Println("Error initializing syslog")
			os.Exit(1)
		}
		log.SetOutput(logwriter)
	case "stdout":
	default:
		fmt.Println("Invalid logger:", logStyle, "please select 'syslog' or 'stdout'")
		os.Exit(1)
	}

	switch arg {
	case "server":
		cmd.Server()
	case "bootstrap":
		cmd.Bootstrap()
	case "drop":
		cmd.Drop()
	default:
		fmt.Println("Invalid command:", arg)
		showUsage()
		os.Exit(1)
	}
}