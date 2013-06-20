require('shelljs/make');

target.bootstrap = function () {
  var capture = require('./lib/store/capture');
  
  mkdir('-p', './data');

  capture().done();
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

    if (!which('pdftohtml')) {
      console.log('ERROR: pdftohtml is required for bootstrap task');
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

