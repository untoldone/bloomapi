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
    max = 50000,
    count = 0;

th = reader
.pipe(split())
.pipe(through(function (line) {
  count += 1;
  if (count < max) {
    this.queue(csv.parse(line));
  }
}));

autodetect = new Autodetect(th);

autodetect.detect(function (err, results) {
  results.forEach(function (result, index) {
    console.log(result[0] + ": " + result[1]); 
  });
});
