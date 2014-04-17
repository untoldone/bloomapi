var fs = require('fs'),
    currentPath = process.cwd() + '/.bloomapi',
    modulePath = __dirname + '/../config.js',
    homePath = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.bloomapi',
    systemPath = '/etc/bloomapi.js';

if (fs.existsSync(currentPath)) {
  module.exports = require(currentPath);
} else if (fs.existsSync(modulePath)) {
  module.exports = require(modulePath);
} else if (fs.existsSync(homePath)) {
  module.exports = require(homePath);
} else if (fs.existsSync(systemPath)) {
  module.exports = require(systemPath);
} else {
  throw new Error("Configuration not found: please create config at <module_path>/config.js, ~/.bloomapi, or /etc/bloomapi.js");
}

module.exports.tmpPath = function (path) {
  var tmpPath = module.exports.tmpdir || __dirname + "/tmp";
  return tmpPath + "/" + path;
};
