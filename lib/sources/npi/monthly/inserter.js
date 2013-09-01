var child_process = require('child_process'),
    fs = require('fs'),
    Q = require('q'),
    config = require('../../../../config'),
    logger = require('../../../logger').data;

module.exports = {
  run: function (path) {
    var deferred = Q.defer(),
        child,
        cmd = "PGPASSWORD=" + config.sql.password + " psql -h " + config.sql.host +  " -U " + config.sql.username + " " + config.sql.dbname + " -c \"\\copy npis_temp from stdin with delimiter as ',' csv header\"",
        err = "",
        csv = fs.createReadStream(path, {encoding: 'utf8'}),
        buffer = "",
        stat;

    logger.info('creating new NPI table with latest monthly dissemination');

    child = child_process.exec(cmd);

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
      err += data;
    });

    csv.on('data', function (chunk) {
      buffer += chunk;
      buffer = buffer.replace(/\"\"/g, '');
      if (buffer[buffer.length - 1] === '"') {
        stat = child.stdin.write(buffer.slice(0, buffer.length - 1));
        if (!stat) {
          csv.pause();
          child.stdin.once('drain', csv.resume.bind(csv));
        }
        buffer = '"';
      } else {
        stat = child.stdin.write(buffer);
        if (!stat) {
          csv.pause();
          child.stdin.once('drain', csv.resume.bind(csv));
        }
        buffer = "";
      }
    });

    csv.on('end', function () {
      child.stdin.once('drain', child.stdin.end);
      child.stdin.end();
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
