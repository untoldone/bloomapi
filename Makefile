export PATH := /usr/local/gonative/go/bin:$(PATH)

all:
	gox -osarch="linux/amd64" -output $(GOPATH)/bin/bloomapi_linux_amd64 github.com/gocodo/bloomapi/bloomapi-server
