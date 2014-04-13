var fs = require('fs'),
    Q = require('q'),
    mustache = require('mustache'),
    config = require('../settings'),
    metaLoader = require('../sources/npi/metaLoader'),
    files = [
        '404',
        'documentation',
        'index',
        'search',
        'contribute'
      ];

function loadTemplates () {
  var calls;

  calls = files.map(function (file) {
    return Q.nfcall(fs.readFile, __dirname + '/' + file + '.mustache', {encoding: 'utf8'});
  });

  return Q.all(calls);
}

function buildDocModel (meta, schema) {
  var expandedMeta = {},
      tempFields = {},
      preparedFields = [],
      indicies = ['npi'],
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
      if (metadata && metadata.map) {
        f.showMap = true;
        f.map = Object.keys(metadata.map).map(function (key) {
          return metadata.map[key];
        });
      }
      if (metadata.index) indicies.push(metadata.key + '.' + f.name);
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
      if (metadata && metadata.map) {
        f.showMap = true;
        f.map = Object.keys(metadata.map).map(function (key) {
          return metadata.map[key];
        });
      }
      if (!tf.some(function (e) { return e.name === f.name; })) {
        if (metadata.index) indicies.push(metadata.key + '.' + f.name);
        tf.push(f);
      }
    } else {
      f.name = (metadata && metadata.rename) ? metadata.rename : elm.name;
      f.description = elm.desc;
      f.source = elm.original;
      if (metadata && metadata.map) {
        f.showMap = true;
        f.map = Object.keys(metadata.map).map(function (key) {
          return metadata.map[key];
        });
      }
      tempFields[f.name] = f;
      if (metadata && metadata.index) indicies.push(f.name);
    }
  });

  Object.keys(tempFields).forEach(function (key) {
    tempFields[key].name = key;
    preparedFields.push(tempFields[key]);
  });

  return {
    search: preparedFields,
    indexed: indicies
  };
}

module.exports = {
  build: function () {
    return Q.all([
      metaLoader.loadFields(),
      metaLoader.loadSchema(),
      loadTemplates()
    ])
    .spread(function (fields, schema, templates) {
      var docModel = buildDocModel(fields, schema),
          calls;

      docModel.config = config;

      calls = templates.map(function (template, index) {
        var doc = mustache.render(template, docModel);
        return Q.nfcall(fs.writeFile, __dirname + '/../../www/' + files[index] + '.html', doc);
      });

      return Q.all(calls);
    });
  }
}
