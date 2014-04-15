module.exports = function () {

};

module.exports.prototype = {
  parse: function (elm) {
    if (typeof elm == 'string' || elm instanceof String) {
      var combos, pairs;
      combos = elm.split(' ');
      pairs = combos.reduce(function (sum, o) {
        var key, value;

        o = o.trim();
        if (o !== "") {
          key = o.slice(0, o.indexOf('='));
          value = o.slice(o.indexOf('=') + 1);
          sum[key] = value;
        }

        return sum;
      }, {});

      return pairs;
    } else {
      return elm;
    }
  }
};
