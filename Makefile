all:
	env GOOS=darwin GOARCH=amd64 go build -o $(GOPATH)/bin/bloomapi -v github.com/untoldone/bloomapi
	env GOOS=linux GOARCH=amd64 go build -o $(GOPATH)/bin/bloomapi_linux_amd64 -v github.com/untoldone/bloomapi
	env GOOS=darwin GOARCH=amd64 go build -o $(GOPATH)/bin/api_keys -v github.com/untoldone/bloomapi/tools/api_keys 
	env GOOS=linux GOARCH=amd64 go build -o $(GOPATH)/bin/api_keys_linux_amd64 -v github.com/untoldone/bloomapi/tools/api_keys 