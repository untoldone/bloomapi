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
    if (source.type === 'monthly') {
      return Q.ninvoke(pg, "query", "DELETE FROM npi_files; INSERT INTO npi_files VALUES ('" + source.name + "');");
    } else {
      return Q.ninvoke(pg, "query", "INSERT INTO npi_files VALUES ('" + source.name + "')");
    }
  }
}
