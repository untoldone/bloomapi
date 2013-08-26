var Q = require('q'),
    pg = require('../../pg'),
    NpiFields = require('../fields');

module.exports = {
  bootstrap: function (fields) {
    var npiIndex = new NpiFields([], fields),
        indices = npiIndex.indices(),
        indicesToCreate = [];
    for (var k in indices) {
      indicesToCreate.push([indices[k]]);
    }

		// generate SQL for indices
    indicesSql = indicesToCreate.map(function(columns){
      return 'CREATE INDEX ON npis_temp ('+columns.join(',')+' ASC NULLS LAST);'
    }).join('\n');
		// actually create the indices with SQL using the pg driver
    return Q.ninvoke(pg, 'query', indicesSql);
  }
}
