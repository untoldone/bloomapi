var http = require('http'),
    fs = require('fs'),
    Q = require('q');

module.exports = {
  fetch: function (url) {
    var deferred = Q.defer();

    http.get(url, function (res) {
      var file;
      res.on('data', function (chunk) {
        file = file ? file + chunk : chunk;
      })
      .on('end', function () {
        deferred.resolve(file.toString());
      })
      .on('error', function (e) {
        deferred.reject(new Error(e));
      });
    });

    return deferred.promise;
  },
  store: function (url, dest) {
    var deferred = Q.defer(),
        fileStream = fs.createWriteStream(dest, {flags: 'w'});

    http.get(url, function (res) {
      res.on('data', function (chunk) {
        fileStream.write(chunk);
      })
      .on('end', function (chunk) {
        fileStream.end(chunk);
        fileStream.on('close', function () {
          deferred.resolve();
        });
      })
      .on('error', function (e) {
        fileStream.end();
        deferred.reject(e);
      });
    });
    
    return deferred.promise;
  }
};
