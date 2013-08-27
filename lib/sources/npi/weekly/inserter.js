var fs = require('fs'),
    Q = require('q'),
    mustache = require('mustache'),
    csvrow = require('csvrow'),
    pg = require('../../pg'),
    config = require('../../../../config'),
    schema = require('../monthly/schema'),
    metaLoader = require('../metaLoader');

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
          query = mustache.render(template, { 
            headers: headersCat,
            lines: lines.slice(0, lines.length - 1),
            lastLine: lines[lines.length - 1],
            setHeaders: setHeaders.slice(0, setHeaders.length - 1),
            lastSetHeader: setHeaders[setHeaders.length - 1]
          });

          pg.query(query, function (err, data) {
            if (err) return deferred.reject(new Error(err));
            deferred.resolve();
          });
        });

        return deferred.promise;
      });
  }
}
