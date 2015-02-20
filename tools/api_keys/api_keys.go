package main

import (
	"os"
	"fmt"
	"github.com/spf13/viper"
	"github.com/untoldone/bloomapi/tools/api_keys/cmd"
)

func showUsage() {
	fmt.Println("Usage: api_keys <command>")
	fmt.Println("=============================\n")
	fmt.Println("Avaialable commands:")
	fmt.Println("api_keys create                         # Create a randomly generated key")
	fmt.Println("api_keys delete <key>                   # Remove a specific key")
	fmt.Println("api_keys associate <key> <search_type>  # allow a key to access a search_type")
	fmt.Println("api_keys dissociate <key> <search_type> # disallow a key to access a search_type")
}

func main() {
	if (len(os.Args) < 2) {
		fmt.Println("Invalid command usage\n")
		showUsage()
		os.Exit(1)
	}

	command := os.Args[1]

	viper.SetConfigName("config")
	viper.AddConfigPath("./")
	err := viper.ReadInConfig()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	switch command {
	case "create":
		err := cmd.Create()
		if err != nil {
			fmt.Println("Failed to Create:", err)
			os.Exit(1)
		}
	case "delete":
		if (len(os.Args) != 3) {
			fmt.Println("Invalid command usage\n")
			showUsage()
			os.Exit(1)
		}

		key := os.Args[2]

		err := cmd.Delete(key)
		if err != nil {
			fmt.Println("Failed to Delete:", err)
			os.Exit(1)
		}
	case "associate":
		if (len(os.Args) != 4) {
			fmt.Println("Invalid command usage\n")
			showUsage()
			os.Exit(1)
		}

		key := os.Args[2]
		searchType := os.Args[3]

		err := cmd.Associate(key, searchType)
		if err != nil {
			fmt.Println("Failed to Associate:", err)
			os.Exit(1)
		}
	case "dissociate":
		if (len(os.Args) != 4) {
			fmt.Println("Invalid command usage\n")
			showUsage()
			os.Exit(1)
		}

		key := os.Args[2]
		searchType := os.Args[3]

		err := cmd.Dissociate(key, searchType)
		if err != nil {
			fmt.Println("Failed to Dissociate:", err)
			os.Exit(1)
		}
	default:
		fmt.Println("Invalid command:", command)
		showUsage()
		os.Exit(1)
	}
}