var fs = require('fs'),
    currentPath = process.cwd() + '/.bloomapi',
    modulePath = __dirname + '/../config.js',
    homePath = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.bloomapi',
    systemPath = '/etc/bloomapi.js';

if (fs.existsSync(currentPath)) {
  module.exports = require(currentPath);
  return;
} else if (fs.existsSync(modulePath)) {
  module.exports = require(modulePath);
  return;
} else if (fs.existsSync(homePath)) {
  module.exports = require(homePath);
  return;
} else if (fs.existsSync(systemPath)) {
  module.exports = require(systemPath);
  return;
} else {
  throw new Error("Configuration not found: please create config at <module_path>/config.js, ~/.bloomapi, or /etc/bloomapi.js");
}
