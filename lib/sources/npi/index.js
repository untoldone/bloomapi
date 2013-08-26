var shelljs = require('shelljs'),
    Q = require('q'),
    sourceMeta = require('../meta'),
    sync = require('./sync'),
    updater = require('./updater');

module.exports = {
  update: function () {
    return sourceMeta.updating('NPI')
      .then(sync.fetchPending)
      .then(function (pending) {
        if (pending.length > 0) {
          return updater.run(pending)
            .then(function () {
              return sourceMeta.updated('NPI');
            })
            .then(function () {
              shelljs.rm('-rf', './data/*');
            });
        } else {
          return sourceMeta.checked('NPI');
        };
    });
  }
}
