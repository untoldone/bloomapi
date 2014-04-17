var request = require("request"),
    fs = require('fs'),
    settings = require("../../lib/settings");

module.exports = function (config) {
  this.url = config.url;
  this.file = config.file;
};

module.exports.prototype = {
  execute: function (data, callback) {
    if (this.file) {
      var fileName = settings.tmpPath(this.file),
          f = fs.createWriteStream(fileName);

      request(this.url).pipe(f)
        .on("finish", function () {
          callback(null, null);
        })
        .on("error", function (err) {
          callback(new Error(err), null); 
        });
    } else {
      callback(null, request(this.url));
    }
  }
};
