var fs          = require('fs'),
    yaml        = require('js-yaml'),
    Q           = require('q'),

    pdftohtml   = require('./pdftohtml'),
    schema      = require('./schema'),
    stp         = require('./schemaToPostgreSQL'),
    inserter    = require('./inserter'),
    indexer     = require('./indexer'),
    nmLoader    = require('../metaLoader'),
    pg          = require('../../pg'),

    csvPathReg  = /\d+\.csv/;

module.exports = {
  run: function (month) {
    var path     = './data/' + month.name,
        pdfPath  = path + '/NPPES  Data Dissemination - Readme.pdf',
        txtPath  = path + '/NPPES  Data Dissemination - Readme.txt',
        files    = fs.readdirSync(path),
        csvPath  = path + "/" + files.filter(function (file) { return csvPathReg.exec(file) })[0],
        cleanSql = "VACUUM ANALYZE npis_temp",
        swapSql  = "BEGIN; DROP TABLE npis; ALTER TABLE npis_temp RENAME TO npis; COMMIT;";

    return pdftohtml.convert(pdfPath)          // Convert NPI documentation PDF to text
      .then(function () {
        return schema.generate(txtPath);
      })                                       // Convert NPI documentation to per-field descriptions and save copy for later
      .then(stp.importSchema)                  // Convert schema into SQL
      .then(function (schema) {
        return Q.ninvoke(pg, 'query', schema); // Create new NPI temp table
      })
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
