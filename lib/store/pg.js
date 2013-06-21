var config = require('../../config'),
    pg = require('pg').native,
    conString = "tcp://" + config.sql.username + ":" + config.sql.password + "@" + config.sql.host + ":" + config.sql.port + "/" + config.sql.dbname,
    connection = new pg.Client(conString);

connection.connect();

module.exports = connection;
