var Parser = require('../actions/parser');

module.exports = function (source) {
  this.source = source;
};

module.exports.prototype = {
  execute: function (callback) {
    // create context
    var context = {},
        index = 0,
        self = this;

    function execAction (err, data) {
      //  parse action
      var parser = new Parser(context),
          actionDetails = parser.parse(self.source[index]),
          action = new actionDetails.action(actionDetails.parameters);
      
      index += 1;
      //  execute
      action.execute(data, function (err, details) {
        if (err) return callback(new Error(err), null);
        //  if 'set', set data in context
        if (actionDetails.parameters.set) {
          context[actionDetails.parameters.set] = details;
        }

        if (index === self.source.length) {
          callback(null, context); 
        } else {
          execAction(null, details);
        }
      });
    }

    execAction(null, null);
  }
};
