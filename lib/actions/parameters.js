module.exports = function (context) {
  this.context = context;
};

function varReplace(s, context) {
  var replaces = {},
      re = /({{([^}]+)}})/g,
      val = s,
      matches, i;

  while (matches = re.exec(val)) {
    if (context[matches[2]]) {
      replaces[matches[1]] = context[matches[2]];
    }
  }

  for (i in replaces) {
    var re = new RegExp(i, 'g');
    val = val.replace(re, replaces[i]);
  }

  return val;
}

module.exports.prototype = {
  parse: function (elm) {
    if (typeof elm == 'string' || elm instanceof String) {
      var self = this, combos, pairs;
      combos = elm.split(' ');
      pairs = combos.reduce(function (sum, o) {
        var key, value;

        o = o.trim();
        if (o !== "") {
          key = o.slice(0, o.indexOf('='));
          value = o.slice(o.indexOf('=') + 1);
          sum[key] = varReplace(value, self.context);
        }

        return sum;
      }, {});

      return pairs;
    } else {
      var i;

      for (i in elm) {
        elm[i] = varReplace(elm[i], this.context);
      }

      return elm;
    }
  }
};
