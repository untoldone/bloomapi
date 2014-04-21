var winston = require('winston'),
    shelljs = require('shelljs');

shelljs.mkdir('-p', './logs');

module.exports = {
  server: new winston.Logger({
    transports: [
      new winston.transports.Console({
        timestamp: true
      }),
      new winston.transports.File({
        filename: 'logs/server.log',
        json: false,
        maxsize: 10485760,
        maxFiles: 5
      })
    ]
  }),
  data: new winston.Logger({
    transports: [
      new winston.transports.Console({
        timestamp: true
      }),
      new winston.transports.File({
        filename: 'logs/data.log',
        json: false,
        maxsize: 10485760,
        maxFiles: 5
      })
    ]
  })
};
