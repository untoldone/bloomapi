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

// calls npi#update
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

// creates the database and calls
// npi#update
target.bootstrap = function () {
  var pg = require('./lib/sources/pg'),
      npi = require('./lib/sources/npi'),
      fs = require('fs');

  logger.data.info('bootstrapping bloomapi');

  target.docs();

  Q.nfcall(fs.readFile, __dirname + '/../lib/bootstrap.sql', {encoding: 'utf8'})
    .then(function (data) {
      return Q.ninvoke(pg, 'query', data);
    })
    .fail(function (e) {
      if(e.code == '42710'){ // "DUPLICATE OBJECT" according to http://www.postgresql.org/docs/9.0/static/errcodes-appendix.html
        logger.data.info("looks like you already have the database schema set up. (bootstrap assumes you don't.)")
        logger.data.info("if you need to update the NPI data, simply run `node make fetch`")
      } else {
        console.error("Error:\n", e.stack);
        process.exit(1);
      }
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

target.docs = function () {
  logger.data.info('building website');
  var docs = require('./lib/docs');
  docs.build().done();
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

