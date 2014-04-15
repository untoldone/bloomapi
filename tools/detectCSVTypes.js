#!/usr/bin/env node

var csv = require('csvrow'),
    Autodetect = require('../lib/sources/autodetect'),
    through = require('through'),
    split = require('split'),
    fs = require('fs');

var reader = fs.createReadStream(process.argv[2]),
    s = new require('stream').Readable({ objectMode: true}),
    autodetect,
    th,
    first = true,
    max = 50000,
    count = 0,
    headers;

th = reader
.pipe(split())
.pipe(through(function (line) {
  count += 1;
  if (count < max) {
    line = csv.parse(line);
    if (first) {
      autodetect = new Autodetect(line);
      headers = line;
      first = false;
    } else {
      this.queue(line);
    }
  }
}));

th.once('data', function () {
  autodetect.detect(th, function (err, results) {
    results.forEach(function (result, index) {
      console.log(headers[index] + ": " + result); 
    });
  });
});
