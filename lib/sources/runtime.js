var Sequence = require('./sequence');

module.exports = function (description) {
  this.description = description;
};

module.exports.prototype = {
  execute: function (seqName, callback) {
    var descName = Object.keys(this.description)[0],
        base = this.description[descName],
        seqDesc = base["sequences"][seqName],
        vars = base["variables"],
        sequence = new Sequence(vars);
    sequence.execute(function (err) {
      if (err) return callback(new Error(err)); 
      callback(null);
    });
  }
};
