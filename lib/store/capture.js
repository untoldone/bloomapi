var npiRemote = require('./npiRemote'),
    unzip = require('./unzip'),
    pdftohtml = require('./pdftohtml'),
    schema = require('./schema'),
    fs = require('fs'),
    stp = require('./schemaToPostgreSQL'),
    Q = require('q'),
    guessFields = require('./guessFields'),
    Inserter = require('./insert'),
    data_dir = './data';

module.exports = function () {
  var remote = new npiRemote();

  console.log('starting data capture');
  console.log('fetching full data dissemination...');
  return remote.fetchFull()
          .then(function (path) {
            console.log('unzipping dissemination...');
            return unzip.unzip(path, data_dir);
          })
          .then(function (path) {
            console.log('discovering dissemination schema...');
            return pdftohtml.convert(data_dir + "/NPPES  Data Dissemination - Readme.pdf");
          })
          .then(function () {
            return schema(data_dir + "/NPPES  Data Dissemination - Readme.txt")
          }).then(function (schema) {
            return guessFields(schema, data_dir + "/npidata_20050523-20130609FileHeader.csv");
          })
          .then(function (schema) {
            console.log('creating database table...');
            var create = stp.importSchema(schema),
                deferred = Q.defer(),
                query = pg.query(create, function (err, result) {
                  if (err) {
                    deferred.reject(new Error(err));
                  }

                  deferred.resolve(result);
                });

            return deferred.promise;
          })
          .then(function () {
            console.log('inserting dissemination data into database...');
            var inserter = new Inserter(data_dir + "/npidata_20050523-20130609.csv");
            return inserter.exec();
          }).then(function () {
            console.log('completed data capture.');
          })
          .fail(function (err) {
            console.log(err.message); 
          });
};
