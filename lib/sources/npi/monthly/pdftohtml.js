var child_process = require('child_process'),
    Q = require('q');
var fs = require('fs');

module.exports = {
  convert: function (path) {
    var deferred = Q.defer(),
        child = child_process.exec('pdftotext -layout "' + path + '"');
    child.on('exit', function (code) {
      if (code === 0) {
        path = path.replace('.pdf', '.txt');
        deferred.resolve();
      } else {
        deferred.reject(new Error('Exit code ' + code));
      }
    });

    return deferred.promise;
  }
}
