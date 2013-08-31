var fs = require('fs'),
    Q = require('q'),
    mustache = require('mustache'),
    metaLoader = require('../sources/npi/metaLoader');

function loadTemplate () {
  return Q.nfcall(fs.readFile, './lib/docs/documentation.mustache', {encoding: 'utf8'});
}

function buildDocModel (meta, schema) {
  var expandedMeta = {},
      tempFields = {},
      preparedFields = [],
      expandable = /^([^\s]+)\{(\d+)\-(\d+)\}$/;
  
  for (var key in meta) {
    // preprocess metadata to 'expand' array metadata items
    var match;
    if (match = expandable.exec(key)) {
      var template = match[1],
          start = parseInt(match[2]),
          end = parseInt(match[3]);
      for (var i = start; i < end + 1; i++) {
        expandedMeta[template + i] = {};
        for (var k in meta[key]) {
          expandedMeta[template + i][k] = meta[key][k];
        }
        expandedMeta[template + i].set = i;
        expandedMeta[template + i].setMax = end;
      }
    } else {
      expandedMeta[key] = meta[key];
    }
  }

  schema.forEach(function (elm) {
    var metadata = expandedMeta[elm.name],
        f = {};

    if (metadata && metadata.key && !metadata.set) {
      if (!tempFields[metadata.key]) {
        f.name = metadata.key;
        f.description = 'An object with the following fields';
        f.fields = [];
        tempFields[f.name] = f;
      }
      f = {};
      var tf = tempFields[metadata.key].fields;
      f.name = (metadata && metadata.rename) ? metadata.rename : elm.name;
      f.description = elm.desc;
      f.source = elm.original;
      tf.push(f);

    } else if (metadata && metadata.set) {
      if (!tempFields[metadata.key]) {
        f.name = metadata.key;
        f.description = 'An array with the following fields per object';
        f.fields = [];
        tempFields[f.name] = f;
      }
      f = {};
      var tf = tempFields[metadata.key].fields;
      f.name = (metadata && metadata.rename) ? metadata.rename : elm.name;
      f.description = elm.desc;
      f.source = /(.*)_\d+/.exec(elm.original)[1] + "_{1-" + metadata.setMax + "}";
      if (!tf.some(function (e) { return e.name === f.name; })) {
        tf.push(f);
      }
    } else {
      f.name = (metadata && metadata.rename) ? metadata.rename : elm.name;
      f.description = elm.desc;
      f.source = elm.original;
      tempFields[f.name] = f;
    }
  });

  Object.keys(tempFields).forEach(function (key) {
    tempFields[key].name = key;
    preparedFields.push(tempFields[key]);
  });

  return {
    search: preparedFields
  };

  return {
    search: [
    {
      name: 'npi',
      description: 'National Provider Identifier',
      source: 'npi'
    },
    {
      name: 'organization_official',
      description: 'An object with the following fields',
      fields: [{
        name: 'credential',
        description: 'Authorized Official Credential Text',
        source: 'Authrozied Official Credential Text'
      }]
    }]
  };
}

module.exports = {
  build: function () {
    return Q.all([
      metaLoader.loadFields(),
      metaLoader.loadSchema(),
      loadTemplate()
    ])
    .spread(function (fields, schema, template) {
      var docModel = buildDocModel(fields, schema),
          doc = mustache.render(template, docModel);

      return Q.nfcall(fs.writeFile, './www/documentation.html', doc);
    });
  }
}
