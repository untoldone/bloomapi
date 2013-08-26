var Q = require('q'),
    pg = require('./pg');

module.exports = {
  updating: function (index) {
    return Q.ninvoke(pg, "query", "UPDATE data_sources SET status = 'RUNNING' WHERE source = '" + index + "'");
  },

  updated: function (index) {
    var updated = (new Date()).toISOString();
    return Q.ninvoke(pg, "query", "UPDATE data_sources SET status = 'READY', updated = '" + updated + "', checked = '" + updated + "' WHERE source = '" + index + "'");

  },

  checked: function (index) {
    var checked = (new Date()).toISOString();
    return Q.ninvoke(pg, "query", "UPDATE data_sources SET status = 'READY', checked = '" + checked + "' WHERE source = '" + index + "'");
  }
}
