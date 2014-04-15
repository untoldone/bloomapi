var Sequelize = require('sequelize'),
    Autodetect = require('./autodetect');

module.exports = function (schema, hintPipe) {
  this.inputSchema = schema;
  this.hintPipe = hintPipe;

  hintPipe.pause();
};

function suplementSchema (oldSchema, pipe, callback) {
  // make copy of schema for updating
  var schema = JSON.parse(JSON.stringify(oldSchema)),
      autodetect = new Autodetect(pipe);

  // run autodetect on schema
  autodetect.detect(function (err, result) {
    if (err) return callback(new Error(err), null);

    for (key in schema) {
      // if type is missing for a given element -- lookup type up in autodetected schema
      if (typeof schema[key] === 'object') {
        if (typeof schema[key].composite === 'undefined' &&
            typeof schema[key].type === 'undefined') {
          schema[key].type = result.keyToType(key);
        }
      } else {
        schema[key] = {
          named: schema[key],
          type: result.keyToType(schema[key])
        }
      }
    }

    // return new schema
    callback(null, schema);
  });
}

function toSequelize(inputSchema) {
  var schema = {},
      key;

  for (key in inputSchema) {
    var elm = inputSchema[key];

    if (typeof elm.composite !== 'undefined') {
      schema[key] = Sequelize.STRING(32);
    } else {
      var parts = elm.type.split('/');
      if (parts.length === 1) {
        schema[key] = Sequelize[elm.type.toUpperCase()]; 
      } else if (parts.length === 2) {
        schema[key] = Sequelize[parts[0].toUpperCase()](parseInt(parts[1])); 
      } else {
        throw new Error("Invalid schema type:" + elm.type.toString());
      }
    }
  }

  return schema;
}

module.exports.prototype = {
  requiresHint: function () {
    var key;

    for (key in this.inputSchema) {
      if (typeof this.inputSchema[key] === 'object') {
        if (typeof this.inputSchema[key].composite === 'undefined' &&
            typeof this.inputSchema[key].type === 'undefined') {
          return true;
        }
      } else {
        return true;
      }
    }

    return false;
  },

  schema: function (callback) {
    if (!this.requiresHint()) {
      var sequelizedSchema = toSequelize(this.inputSchema);
      callback(null, sequelizedSchema);
    } else {
      suplementSchema(this.inputSchema, this.hintPipe, function (err, result) {
        if (err) return callback(new Error(err), result);
        var sequelizedSchema = toSequelize(result);
        callback(null, sequelizedSchema);
      });
    }
  }
};
