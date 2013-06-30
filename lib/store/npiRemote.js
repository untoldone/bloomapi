var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    Q = require('q'),
    weeklyRegex = /NPPES_Data_Dissemination_(\d+_\d+)_Weekly.zip/g,
    fullRegex = /NPPES_Data_Dissemination_([a-zA-Z]+_\d+).zip/,
    npiUri = "http://nppes.viva-it.com/NPI_Files.html",
    npiFullTemplate = "http://nppes.viva-it.com/NPPES_Data_Dissemination_{0}.zip",
    npiFullFileTemplate = "NPPES_Data_Dissemination_{0}.zip",
    npiWeeklyTemplate = "http://nppes.viva-it.com/NPPES_Data_Dissemination_{0}_{1}_Weekly.zip";

module.exports = function () {};

function fetch (uri) {
  var options = url.parse(uri),
      deferred = Q.defer(),
      progress = 0,
      size;

  http.get(options, function (res) {
    res.on('response', function (response) {
      size = response.headers['content-length'];
    }).on('data', function (chunk) {
      progress += chunk.length;
      deferred.notify({chunk: chunk, progress: progress / size});
    }).on('end', function () {
      deferred.resolve();
    }).on('error', function (e) {
      deferred.reject(new Error(e)); 
    });
  });

  return deferred.promise;
}

function fetchIndex() {
  if (this.fetched === undefined) {
    var collected,
        deferred = Q.defer();

    fetch(npiUri).then(function () {
      this.fetched = collected.toString();
      deferred.resolve(collected.toString());
    }, function () {},
    function (chunk) {
      collected = collected ? collected + chunk.chunk : chunk.chunk;
    });

    return deferred.promise;
  } else {
    return Q.fcall(function () {
      return this.fetched;
    });
  }
}

module.exports.prototype = {
  currentFullID: function () {
    return fetchIndex.bind(this)()
    .then(function (data) {
      var match = fullRegex.exec(data);
      if (match && match[1]) {
        return match[1];
      } else {
        throw new Error("Full download URI not found");
      }
    });
  },
  currentWeeklyIDs: function () {
    return fetchIndex.bind(this)()
    .then(function (data) {
      var matches = [],
          match;
      while (match = weeklyRegex.exec(data)) {
        matches.push(match[1]);
      }

      return matches;
    });
  },
  fetchFull: function (data_dir) {
    var deferred = Q.defer(),
        fileStream,
        filePath,
        id;

    this.currentFullID()
      .then(function (full) {
        var uri = npiFullTemplate.replace('{0}', full);

        id = full;
        fileName = npiFullFileTemplate.replace('{0}', full);
        fileStream = fs.createWriteStream(data_dir + '/' + fileName, {flags: 'w'});

        return fetch(uri);
      }).then(function () {
        fileStream.end(null, null, function () {
          deferred.resolve(data_dir + '/' + fileName);
        });
      }, 
      function (err) {
        deferred.reject(new Error(err));
      },
      function (chunk) {
        deferred.notify(chunk.progress);
        fileStream.write(chunk.chunk);
      });

    return deferred.promise;
  },
  fetchWeekly: function (id) {

  }
};
