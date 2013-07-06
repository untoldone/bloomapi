require('shelljs/make');

// default target
target.all = function () {
  console.log("\nAvailable commands:\n-------------------");
  console.log(" node make bootstrap     # fetch, process, and insert NPI data into database")
  console.log(" node make process       # like 'bootstrap' but assumes you have already downloaded the NPI data into data/")
  console.log(" node make server        # run web/API server")
  console.log(" node make check         # checks your environment for configuration files and some dependencies")
  console.log("\n For more information, visit the project README file on github at https://github.com/untoldone/bloomapi\n")
}

target.bootstrap = function () {
  var capture = require('./lib/store/capture');
  
  mkdir('-p', './data');

  capture().done();
};

target.process = function () {
  var capture = require('./lib/store/capture');
  
  capture('process').done();
};

target.server = function () {
  require('./lib/api/server');
};

target.check = function () {
  if (!test('-f', './config.js')) {
    console.log('ERROR: no configuration file found, copy and configure ./config.js.sample to ./config.js');
  }

  var valid = true,
      pg = require('./lib/store/pg'),
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

