var Q = require('q'),
    monthly = require('./monthly'),
    weekly = require('./weekly'),
    local = require('./local');

module.exports = {
  run: function (pending) {
    var months = pending.filter(function (elm) { return elm.type === 'monthly' }),
        weeks = pending.filter(function (elm) { return elm.type === 'weekly' }),
        promise = Q();

    if (months.length > 0) {
      promise = monthly.run(months[0])
        .then(function () {
          return local.commitSource(months[0]);
        });
    }

    if (weeks.length > 0) {
      weeks.forEach(function (week) {
        promise = Q.when(promise, function () {
            return weekly.run(week);
          })
          .then(function () {
            return local.commitSource(week);
          });
      });
    }

    return promise;
  }
};
