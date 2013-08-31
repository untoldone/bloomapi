var shelljs = require('shelljs'),
    Q = require('q'),
    sourceMeta = require('../meta'),
    sync = require('./sync'),
    updater = require('./updater'),
    logger = require('../../logger').data;

module.exports = {
  update: function () {
    logger.info('updating NPI datasources');
    return sourceMeta.updating('NPI')
      .then(sync.fetchPending)
      .then(function (pending) {
        if (pending.length > 0) {
          logger.info('syncing new NPI data files'); 
          return updater.run(pending)
            .then(function () {
              return sourceMeta.updated('NPI');
            })
            .then(function () {
              shelljs.rm('-rf', './data/*');
            });
        } else {
          logger.info('no new NPI data files found'); 
          return sourceMeta.checked('NPI');
        };
    });
  }
}
