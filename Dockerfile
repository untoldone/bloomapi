FROM golang:1.6.2

ADD . /go/src/github.com/untoldone/bloomapi
ADD config.toml.sample /go/bin/config.toml

RUN go install github.com/untoldone/bloomapi
RUN go install github.com/untoldone/bloomapi/tools/api_keys

ENTRYPOINT /go/bin/bloomapi

CMD [ "server" ]

EXPOSE 3005
