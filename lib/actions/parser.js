var Parameters = require('./parameters');

module.exports = function (context) {
  this.context = context;
  this.parameters = new Parameters(context);
};
  
function loadAction (name, dir) {
  var action;
  try {
    action = require('../../actions/' + name);
  } catch (err) {
    try {
      action = require(dir + "/actions/" + name);
    } catch (err) {
      throw new Error(err); 
    }
  }

  return action;
}


module.exports.prototype = {
  parse: function (obj) {
    var keys = Object.keys(obj),
        rawParams = obj[keys[0]],
        action;

    if (keys.length != 1) throw new Error("Invalid action specification");

    action = loadAction(keys[0], this.context.dir);
    
    return {
      action: action,
      parameters: this.parameters.parse(rawParams)
    }
  }
};
