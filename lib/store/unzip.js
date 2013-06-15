var child_process = require('child_process'),
    Q = require('q');

module.exports = {
  unzip: function (path, outputDir) {
    var deferred = Q.defer(),
        child = child_process.exec('7z e ' + path + ' -o' + outputDir);

    child.on('exit', function (code) {
      if (code === 0) {
        deferred.resolve();
      } else {
        deferred.reject(new Error("Exit code " + code));
      }
    });

    return deferred.promise;
  }
}
