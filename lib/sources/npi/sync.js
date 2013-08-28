var Q = require('q'),
    shelljs = require('shelljs'),
    fs = require('fs'),
    child_process = require('child_process'),
    npiRemote = require('./remote'),
    npiLocal = require('./local'),
    remoteFile = require('./remoteFile');

function prep (details) {
  var path = './data/' + details.name + '.zip',
      fileStream = fs.createWriteStream(path, {flags: 'w'});

  return remoteFile.store(details.url, path)
    .then(function () {
      var deferred = Q.defer(),
          destPath = './data/' + details.name,
          cmd = '7z e ' + path + ' -y -o' + destPath,
          child;
          
      shelljs.mkdir('-p', destPath);

      child = child_process.exec(cmd);

      child.on('exit', function (code) {
        if (code === 0) {
          deferred.resolve();
        } else {
          deferred.reject(new Error("Exit code " + code));
        }
      });

      return deferred.promise;
    });
}


module.exports = {
  fetchPending: function () {
    shelljs.mkdir('-p', './data');

    return Q.all([
        npiRemote.fetchSources(),
        npiLocal.fetchSources()
      ])
      .spread(function (remotes, locals) {
        var localMap = {},
            pending = [],
            fetchOps = [];
        
        // Build a lookup table for which npi files have already been collected
        locals.forEach(function (local) {
          localMap[local.name] = true;
        });

        // Build a set of fetch/unzip operations for files that haven't been collected
        remotes.forEach(function (remote) {
          if (!localMap[remote.name]) {
            pending.push(remote);
            fetchOps.push(prep(remote));
          }
        });

        return Q.all(fetchOps)
          .then(function () {
            return pending;
          });
      });
  }
};
