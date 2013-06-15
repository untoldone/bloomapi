var util = require('./schemaUtility');


module.exports = function (path) {
  return util.loadFile(path)
    .then(function (content) {
      // split at '<br />'
      var lines = util.split(content);
      // trim lines at beginning and end of document that are unused
      lines = util.trimUnused(lines);
      // remove table headers and everything except for schema specific content
      lines = util.removeBreaks(lines);
      // convert cleaned lines to actual schema description
      return util.toSchema(lines);
    });
}

