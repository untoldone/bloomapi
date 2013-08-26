var Q = require('q'),
    fs = require('fs'),
    yaml = require('js-yaml');

function loadYaml(path) {
  var deferred = Q.defer();

  fs.readFile(path, 'utf-8', function (err, data) {
    if (err) return deferred.reject(new Error(err));
    
    var meta = yaml.safeLoad(data);

    deferred.resolve(meta);
  });

  return deferred.promise;
}

module.exports = {
  loadFields: function () {
    return loadYaml('./lib/sources/npi/metadata/npi.yml');
  },
  loadSchema: function () {
    return loadYaml('./lib/sources/npi/metadata/schema.yml');
  }
};
