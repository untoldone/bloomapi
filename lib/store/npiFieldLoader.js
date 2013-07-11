var npiFields = require('./npiFields.js'),
    Q = require('q'),
    fs = require('fs'),
    yaml = require('js-yaml');

module.exports = {
  load: function () {
    var deferred = Q.defer();

    fs.readFile('./lib/store/npiFields.yml', 'utf-8', function (err, data) {
      if (err) return deferred.reject(new Error(err));

      var meta = yaml.safeLoad(data),
          nFields = new npiFields(meta);

      deferred.resolve(nFields);
    });

    return deferred.promise;
  }
};
