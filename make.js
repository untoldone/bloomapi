require('shelljs/make');

var logger = require('./lib/logger');

// default target
target.all = function () {
  console.log("\nAvailable commands:\n-------------------");
  console.log(" node make bootstrap     # fetch, process, and insert NPI data into database")
  console.log(" node make fetch         # like 'bootstrap' but assumes you already have the base sql database setup")
  console.log(" node make server        # run web/API server")
  console.log(" node make check         # checks your environment for configuration files and some dependencies")
  console.log("\n For more information, visit the project README file on github at https://github.com/untoldone/bloomapi\n")
}

var Q = require('q');
Q.longStackSupport = true;

target.fetch = function () {
  var pg = require('./lib/sources/pg'),
      npi = require('./lib/sources/npi');

  logger.data.info('attempting to sync datasources');

  npi.update()
    .fail(function (e) {
      console.error("Error:\n" + e.stack); 
      process.exit(1);
    })
    .done(function () {
      pg.end(); 
    });
};

target.bootstrap = function () {
  var pg = require('./lib/sources/pg'),
      npi = require('./lib/sources/npi'),
      fs = require('fs');

  logger.data.info('bootstrapping bloomapi');

  Q.nfcall(fs.readFile, './lib/bootstrap.sql', {encoding: 'utf8'})
    .then(function (data) {
      return Q.ninvoke(pg, 'query', data);
    })
    .then(npi.update)
    .fail(function (e) {
      console.error("Error:\n", e.stack);
      process.exit(1);
    })
    .done(function () {
      pg.end(); 
    });
}

target.server = function () {
  logger.server.info('starting bloomapi');
  require('./lib/api/server');
};

target.check = function () {
  if (!test('-f', './config.js')) {
    console.log('ERROR: no configuration file found, copy and configure ./config.js.sample to ./config.js');
  }

  var valid = true,
      pg = require('./lib/sources/pg'),
      query = pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", function (err, result) {
    if (err) {
      console.log('ERROR: running query on database, check credentials');
      valid = false;
    }

    if (!which('7z')) {
      console.log('ERROR: p7zip is required for bootstrap task');
      valid = false;
    }

    if (!which('pdftotext')) {
      console.log('ERROR: pdftotext is required for bootstrap task');
      valid = false;
    }

    if (valid) {
      console.log('PASSED: all checks');
    }
  });

  query.on('end', function () {
    pg.end();
  });

};

