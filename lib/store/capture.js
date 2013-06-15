var npiRemote = require('./npiRemote'),
    unzip = require('./unzip'),
    pdftohtml = require('./pdftohtml'),
    data_dir = './data';

module.exports = function () {
  var remote = new npiRemote();

  remote.fetchFull()
    .then(function (path) {
      return unzip.unzip(path, data_dir);
    }).then(function () {
      return pdftohtml.convert(data_dir + "/NPPES  Data Dissemination - Readme.pdf");
    });
};
