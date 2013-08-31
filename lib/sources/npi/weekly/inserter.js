var fs = require('fs'),
    Q = require('q'),
    mustache = require('mustache'),
    csvrow = require('csvrow'),
    pg = require('../../pg'),
    config = require('../../../../config'),
    schema = require('../monthly/schema'),
    metaLoader = require('../metaLoader'),
    logger = require('../../../logger').data;

module.exports = {
  run: function (path) {
    return metaLoader.loadSchema()
      .then(function (rawSchema) {
        var csv = fs.createReadStream(path, {encoding: 'utf8'}),
            template = fs.readFileSync('./lib/sources/npi/weekly/upsert.mustache', {encoding: 'utf8'}),
            deferred = Q.defer(),
            buffer = "",
            numberLookup = {},
            typeLookup = {},
            numberIndices = {},
            dateLookup = {},
            dateIndices = {};

        rawSchema.forEach(function (item) {
          if (item.type === 'NUMBER') {
            numberLookup[item.name] = true;
          } else if (item.type === 'DATE') {
            dateLookup[item.name] = true;
          }
        });

        csv.on('data', function (chunk) {
          buffer += chunk;
        });

        csv.on('end', function () {
          var lines,
              headerLine,
              headers,
              headersCat,
              setHeaders;
              
          buffer = buffer.replace(/\"\"/g, 'NULL');

          lines = buffer.split("\n");
          headerLine = lines[0];
          lines = lines.slice(1, lines.length - 1);

          headers = headerLine.split(',');
          headers = headers.map(function (header) { return header.replace(/"/g, ''); });
          headers = headers.map(function (header) { return schema.fieldName(header); });

          headers.forEach(function (header, index) {
            if (numberLookup[header]) {
              numberIndices[index] = true;
            } else if (dateLookup[header]) {
              dateIndices[index] = true;
            }
          });

          logger.info('updating ' + lines.length + ' NPI records');

          lines = lines.map(function (line) {
            var parts = csvrow.parse(line);
            parts.forEach(function (part, index) {
              if (numberIndices[index]) {
                parts[index] += "::bigint";
              } else {
                if (parts[index] !== 'NULL') {
                  parts[index] = "'" + parts[index].replace(/'/g, "''") + "'";
                }

                if (dateIndices[index]) {
                  parts[index] += "::date";
                }
              }

            });

            return parts.join(',');
          });

          headersCat = headers.join(',');

          setHeaders = headers.map(function (header) { return header + " = nv." + header; });

          var querySize = 150.0,
              loops = Math.ceil(lines.length / querySize),
              i = 0,
              promise;
          
          for(; i < loops; i++) {
            promise = function c (promise) {
              var first = i * querySize,
                  last = ((i + 1) * querySize) > lines.length ? lines.length : (i + 1) * querySize,
                  query = mustache.render(template, { 
                      headers: headersCat,
                      lines: lines.slice(first, last - 1),
                      lastLine: lines[last - 1],
                      setHeaders: setHeaders.slice(0, setHeaders.length - 1),
                      lastSetHeader: setHeaders[setHeaders.length - 1]
                    });
              promise = Q.when(promise, function () {
                return Q.ninvoke(pg, 'query', query);
              });

              return promise;
            }(promise);

          }

          promise.then(function () {
            deferred.resolve();  
          }, function (err) {
            deferred.reject(new Error(err)); 
          });
        });

        return deferred.promise;
      });
  }
}
