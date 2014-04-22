var Sequelize = require('sequelize');

module.exports = {
  schemaToSequelize: function (inputSchema) {
    var model = {},
        key;

    Object.keys(inputSchema).forEach(function (key) {
      model[key] = {};
    });

    for (key in inputSchema) {
      var elm = inputSchema[key];

      if (typeof elm.composite !== 'undefined') {
        model[key] = Sequelize.STRING(32);
      } else {
        var parts = elm.type.split('/');
        if (parts.length === 1) {
          model[key] = Sequelize[elm.type.toUpperCase()]; 
        } else if (parts.length === 2) {
          model[key] = Sequelize[parts[0].toUpperCase()](parseInt(parts[1])); 
        } else {
          throw new Error("Invalid schema type:" + elm.type.toString());
        }
      }
    }

    return model;
  }
};
