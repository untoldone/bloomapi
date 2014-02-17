var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('provider_business_practice_locations', {
      npi: { type: 'string', primaryKey: true },
      latitude: {type: 'real'},
      longitude: {type: 'real'}
    }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('provider_business_practice_locations', callback);
};
