export PATH := /usr/local/gonative/go/bin:$(PATH)

all:
	gox -osarch="linux/amd64" -output $(GOPATH)/bin/bloomapi_linux_amd64 github.com/untoldone/bloomapi
	gox -osarch="linux/amd64" -output $(GOPATH)/bin/api_keys_linux_amd64 github.com/untoldone/bloomapi/tools/api_keys
