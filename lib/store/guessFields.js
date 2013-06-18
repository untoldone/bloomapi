var fs = require('fs'),
    stp = require('./schemaToPostgreSQL'),
    Q = require('q');

module.exports = function (schema, path) {
  var deferred = Q.defer();

  fs.readFile(path, 'utf8', function (err, data) {
    var fields = [];

    if (err) {
      return deferred.reject(new Error(err));
    }
    data = data.replace("\n", '');
    data.split(',').forEach(function (entry) {
      entry = entry.trim().slice(1, entry.length - 1);
      fields.push(entry);
    });

    schema.forEach(function (entry) {
      var i = 0,
          len = fields.length,
          found = false;

      for (; i < len; i++) {
        if (fields[i].indexOf(entry.name) !== -1) {
          entry.name = fields[i];
          fields.splice(i, 1);
          found = true;
          break;
        }
      }

      if (!found) {
        console.log('Warning: Could not match schema name for ' + entry.name);
      }
    });

    if (fields.length > 0) {
      console.log('Warning: Could not match field header(s): ' + fields.join(',') + ' to schema entries');
    }

    deferred.resolve(schema);
  });

  return deferred.promise;
};

