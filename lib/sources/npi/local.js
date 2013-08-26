var Q = require('q'),
    pg = require('../pg');

module.exports = {
  fetchSources: function () {
    return Q.ninvoke(pg, "query", "SELECT name FROM npi_files")
            .then(function (results) {
              return results.rows.map(function (row) {
                var type = /Weekly/.exec(row.name) ? 'weekly' : 'monthly',
                    url = "http://nppes.viva-it.com/" + row.name + ".zip";
                
                return {
                  name: row.name,
                  url: url,
                  type: type
                };
              });
            });
  },

  commitSource: function (source) {
    return Q.ninvoke(pg, "query", "INSERT INTO npi_files VALUES ('" + source.name + "')");
  }
}
