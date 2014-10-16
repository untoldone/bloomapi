var fs          = require('fs'),
    yaml        = require('js-yaml'),
    Q           = require('q'),

    stp         = require('./schemaToPostgreSQL'),
    inserter    = require('./inserter'),
    indexer     = require('./indexer'),
    nmLoader    = require('../metaLoader'),
    pg          = require('../../pg'),

    csvPathReg  = /\d+\.csv/;

module.exports = {
  run: function (month) {
    var path     = './data/' + month.name,
        files    = fs.readdirSync(path),
        schema   = yaml.safeLoad(fs.readFileSync(__dirname + '/../metadata/schema.yml', 'utf8'));
        csvPath  = path + "/" + files.filter(function (file) { return csvPathReg.exec(file) })[0],
        cleanSql = "VACUUM ANALYZE npis_temp",
        swapSql  = "BEGIN; DROP TABLE npis; ALTER TABLE npis_temp RENAME TO npis; COMMIT;",
        createSql = stp.importSchema(schema); // Convert schema into SQL

    return Q.ninvoke(pg, 'query', createSql) // Create new NPI temp table
      .then(function () {
        return inserter.run(csvPath);
      })                                       // Import NPI data from CSV
      .then(nmLoader.loadFields)               // Load additional field metadata to fetch db index configuration
      .then(indexer.bootstrap)                 // Create indexes on NPI temp table
      .then(function () {
        return Q.ninvoke(pg, 'query', cleanSql);  // Re-Analyze with new data + indexes
      })
      .then(function () {
        return Q.ninvoke(pg, 'query', swapSql);  // Swap production NPI table with NPI temp table
      });
  }
};
