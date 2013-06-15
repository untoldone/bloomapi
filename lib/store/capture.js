var npiRemote = require('./npiRemote'),
    unzip = require('./unzip'),
    pdftohtml = require('./pdftohtml'),
    schema = require('./schema'),
    fs = require('fs'),
    data_dir = './data';

module.exports = function () {
  var remote = new npiRemote();

  return remote.fetchFull()
    .then(function (path) {
      return unzip.unzip(path, data_dir);
    }).then(function () {
      return pdftohtml.convert(data_dir + "/NPPES  Data Dissemination - Readme.pdf");
    }).then(function () {
      return schema(data_dir + "/NPPES  Data Dissemination - Readmes.html");
    }).then(function (schema) {
      return fs.writeFileSync(data_dir + '/schema.json', JSON.stringify(schema, null, 2));
    });
};
