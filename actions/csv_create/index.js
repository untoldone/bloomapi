var settings = require('../../lib/settings'),
    Autodetect = require('../../lib/sources/autodetect'),
    Q = require('q');

module.exports = function (config) {
  this.table = config.table;
};

module.exports.prototype = {
  execute: function (data, callback) {
    var inputStream, autodetect
    // build input csv stream
    inputStream = data;

    // run autodetect on columns give dataset
    autodetect = new Autodetect(inputStream);

    Q.ninvoke(autodetect, 'detect')
      // create table
      .then(function (columns) {
        var schema = columns.inject(function (sum, column) {
          sum[column[0]] = {
            named: column[0],
            type: column[1]
          };
        }, {});



        return schema;
      })
      // run copy command
      .then(function () {

      })
      .fail(function (err) {
        callback(new Error(err), null);
      });
  }
};
