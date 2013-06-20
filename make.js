require('shelljs/make');

target.bootstrap = function () {
  var capture = require('./lib/store/capture');
  
  mkdir('-p', './data');

  capture().done();
};

target.server = function () {
  require('./lib/api/server');
};

