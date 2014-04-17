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
      autodetect = new Autodetect(pipe),
      table, key;

  // run autodetect on schema
  autodetect.detect(function (err, result) {
    if (err) return callback(new Error(err), null);

    for (table in schema) {
      if (schema[table] != null) {
        for (key in schema[table]) {
          // if type is missing for a given element -- lookup type up in autodetected schema
          if (typeof schema[table][key] === 'object') {
            if (typeof schema[table][key].composite === 'undefined' &&
                typeof schema[table][key].type === 'undefined') {
              schema[table][key].type = result.keyToType(key);
            }
          } else {
            var match;
            if (match = /^\/(.+)\/$/.exec(schema[table][key])) {
              schema[table][key] = new RegExp(match[1]); 
            };

            schema[table][key] = {
              named: schema[table][key],
              type: result.keyToType(schema[table][key])
            }
          }
        }
      } else {
        schema[table] = result.reduce(function (sum, elm) {
          sum[elm[0]] = {
            named: elm[0],
            type: elm[1]
          };
          return sum; 
        }, {});
      }
    }

      // return new schema
    callback(null, schema);
  });
}

function toSequelize(inputSchema) {
  var schema = {},
      key;

  Object.keys(inputSchema).forEach(function (key) {
    schema[key] = {};
  });

  for (table in inputSchema) {
    for (key in inputSchema[table]) {
      var elm = inputSchema[table][key];

      if (typeof elm.composite !== 'undefined') {
        schema[table][key] = Sequelize.STRING(32);
      } else {
        var parts = elm.type.split('/');
        if (parts.length === 1) {
          schema[table][key] = Sequelize[elm.type.toUpperCase()]; 
        } else if (parts.length === 2) {
          schema[table][key] = Sequelize[parts[0].toUpperCase()](parseInt(parts[1])); 
        } else {
          throw new Error("Invalid schema type:" + elm.type.toString());
        }
      }
    }
  }

  return schema;
}

module.exports.prototype = {
  requiresHint: function () {
    var key;

    for (table in this.inputSchema) {
      if (this.inputSchema[table] == null) return true;

      for (key in this.inputSchema[table]) {
        if (typeof this.inputSchema[table][key] === 'object') {
          if (typeof this.inputSchema[table][key].composite === 'undefined' &&
              typeof this.inputSchema[table][key].type === 'undefined') {
            return true;
          }
        } else {
          return true;
        }
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
