package main

import (
	"os"
	"fmt"
	"github.com/untoldone/bloomapi"
	"github.com/spf13/viper"
)

func showUsage() {
	fmt.Println("Usage: bloomapi-npi <command>")
	fmt.Println("=============================\n")
	fmt.Println("Avaialable commands:")
	fmt.Println("bloomapi-npi server    # run BloomAPI server")
}

func main() {
	if (len(os.Args) != 2) {
		fmt.Println("Invalid command usage\n")
		showUsage()
		os.Exit(1)
	}

	arg := os.Args[1]

	viper.SetConfigType("toml")

	switch arg {
	case "server":
		bloomapi.Server()
	default:
		fmt.Println("Invalid command:", arg)
		showUsage()
		os.Exit(1)
	}
}