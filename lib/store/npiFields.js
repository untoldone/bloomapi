var Q = require('q'),
    fs = require('fs'),
    yaml = require('js-yaml'),
    expandable = /^([^\s]+)\{(\d+)\-(\d+)\}$/,
    expandedMeta;

function fetchMeta() {
  if (expandedMeta) {
    return Q.fCall(function () {
      return expandedMeta;
    });
  } else {
    var deferred = Q.defer();

    fs.readFile('./lib/store/npiFields.yml', 'utf-8', function (err, data) {
      if (err) {
        return deferred.reject(new Error(err));
      }
      
      expandedMeta = {};
      meta = yaml.safeLoad(data);
      for (var key in meta) {
        var match;
        if (match = expandable.exec(key)) {
          var template = match[1],
              start = parseInt(match[2]),
              end = parseInt(match[3]);
          for (var i = start; i < end + 1; i++) {
            expandedMeta[template + i] = {};
            for (var k in meta[key]) {
              expandedMeta[template + i][k] = meta[key][k];
            }
            expandedMeta[template + i].set = i;
          }
        } else {
          expandedMeta[key] = meta[key];
        }
      }

      deferred.resolve(expandedMeta);
    });


    return deferred.promise;
  }
}

module.exports = {
  process: function (records) {
    return fetchMeta()
      .then(function (metas) {
        var transformed = [];

        records.forEach(function (record) {
          var trecord = {};
          transformed.push(trecord);

          for (var key in record) {
            var meta = metas[key];
            if (meta) {
              var name, value;
             
              if (meta.rename) {
                name = meta.rename;
              } else {
                name = key;
              }

              if (meta.map) {
                value = meta.map[record[key]];
              } else {
                value = record[key];
              }

              if (meta.key) {
                if (meta.set) {
                  if (!trecord[meta.key]) {
                    trecord[meta.key] = [];
                  }
                  if (trecord[meta.key].length < meta.set) {
                    for (var i = 0; i <= (meta.set - trecord[meta.key].length); i++) {
                      trecord[meta.key].push({});
                    }
                  }
                  trecord[meta.key][meta.set - 1][name] = value;
                } else {
                  if (!trecord[meta.key]) trecord[meta.key] = {};
                  trecord[meta.key][name] = value;
                }
              } else {
                trecord[name] = value;
              }
            } else {
              trecord[key] = record[key]
            }
          }
        });

        return transformed;
      });
  }
}
