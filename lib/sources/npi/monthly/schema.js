var fs = require('fs'),
    Q = require('q'),
    yaml = require('js-yaml'),
    util = require('./schemaUtility'),
    stp = require('./schemaToPostgreSQL');
var p = require('path');
module.exports = {
	fieldName: function (name) {
		return name.toLowerCase()
			.replace(/\s|\(|\)|\./g, '_') // replace all non characters with _
			.replace(/__+/g, '_') // remove multiple _ in a row from last replace
			.replace(/^_/, '')
			.replace(/_$/, '');
	},
  generate: function (path) {
    return Q.fcall(fs.readFileSync, path, {encoding: 'utf8'})
      .then(function (content) {
        // split at '\n'
        var lines = util.split(content);
        // trim lines at beginning and end of document that are unused
        lines = util.trimUnused(lines);
        // remove table headers and everything except for schema specific content
        lines = util.removeBreaks(lines);
        // convert cleaned lines to actual schema description
        schema = util.toSchema(lines);

        schema.forEach(function (entry) {
          entry.original = entry.name;
          entry.name = module.exports.fieldName(entry.name);
        });

        yml = yaml.safeDump(schema);
        fs.writeFileSync('./lib/sources/npi/metadata/schema.yml', yml);

        return schema;
      })
  }
}
