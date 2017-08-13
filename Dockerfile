FROM golang:1.8.3

ADD . /go/src/github.com/untoldone/bloomapi
ADD config.toml.sample /go/bin/config.toml
ADD docker-start.sh /start.sh

RUN go install github.com/untoldone/bloomapi
RUN go install github.com/untoldone/bloomapi/tools/api_keys

ENTRYPOINT /start.sh

EXPOSE 3005
