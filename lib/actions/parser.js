var Parameters = require('./parameters');

module.exports = function (context) {
  this.parameters = new Parameters(context);
};

function loadAction (name) {
  var action = require('../../actions/' + name);
  return action;
}

module.exports.prototype = {
  parse: function (obj) {
    var keys = Object.keys(obj),
        rawParams = obj[keys[0]],
        action;

    if (keys.length != 1) throw new Error("Invalid action specification");

    action = loadAction(keys[0]);
    
    return {
      action: action,
      parameters: this.parameters.parse(rawParams)
    }
  }
};
