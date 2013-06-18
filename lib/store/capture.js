var npiRemote = require('./npiRemote'),
    unzip = require('./unzip'),
    pdftohtml = require('./pdftohtml'),
    schema = require('./schema'),
    fs = require('fs'),
    pg = require('./pg'),
    stp = require('./schemaToPostgreSQL'),
    Q = require('q'),
    guessFields = require('./guessFields'),
    data_dir = './data';

module.exports = function () {
  //var remote = new npiRemote();

  /*
  return remote.fetchFull()
    .then(function (path) {
      return unzip.unzip(path, data_dir);
    }).then(function () {
      return pdftohtml.convert(data_dir + "/NPPES  Data Dissemination - Readme.pdf");
    }).then(function () {
      return schema(data_dir + "/NPPES  Data Dissemination - Readmes.html");
    }).then(function (schema) {
      var create = stp.importSchema(schema),
          deferred = Q.defer(),
          query = pg.query(create, function (err, result) {
            if (err) {
              deferred.reject(new Error(err));
            }

            deferred.resolve(result);
          });
      return deferred;
    });
  */

  return pdftohtml.convert(data_dir + "/NPPES  Data Dissemination - Readme.pdf")
          .then(function () {
            return schema(data_dir + "/NPPES  Data Dissemination - Readmes.html");
          }).then(function (schema) {
            return guessFields(schema, data_dir + "/npidata_20050523-20130609FileHeader.csv");
          })
          .then(function (schema) {
            var create = stp.importSchema(schema),
                deferred = Q.defer(),
                query = pg.query(create, function (err, result) {
                  if (err) {
                    deferred.reject(new Error(err));
                  }

                  deferred.resolve(result);
                });
            return deferred.promise;
          }).fail(function (err) {
            console.log(err.message); 
          });
};
