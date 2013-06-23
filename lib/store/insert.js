var child_process = require('child_process'),
    Q = require('q'),
    config = require('../../config');

var insert = function (path) {
  this.path = path;
}

insert.prototype = {
  exec: function () {
    var deferred = Q.defer(),
        child,
        cmd = "sed 's/\"\"//g' " + this.path + " | PGPASSWORD=" + config.sql.password + " psql -h " + config.sql.host +  " -U " + config.sql.username + " " + config.sql.dbname + " -c \"\\copy npis from stdin with delimiter as ',' csv header\"",
        err = "";

    child = child_process.exec(cmd);

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
      err += data;
    });

    child.on('exit', function (code) {
      if (code === 0) {
        deferred.resolve();
      } else {
        deferred.reject(new Error("Failed with error: " + code + " : " + err));
      }
    });

    return deferred.promise;
  }
};

module.exports = insert;
