var fs = require('fs'),
    inserter = require('./inserter'),
    csvPathReg = /\d+\.csv/;

module.exports = {
  run: function (week) {
    var path = './data/' + week.name,
        files = fs.readdirSync(path),
        csvPath = path + "/" + files.filter(function (file) { return csvPathReg.exec(file); })[0];

    return inserter.run(csvPath);
  }
}
