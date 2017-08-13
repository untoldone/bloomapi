#!/bin/bash

sleep 15 # wait for db to come up if started at the same time

/go/bin/bloomapi bootstrap || true # Boostrap if not previously bootstrapped

/go/bin/bloomapi server
