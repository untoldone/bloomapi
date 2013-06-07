var http = require('http'),
    weeklyRegex = /NPPES_Data_Dissemination_\d+_\d+_Weekly.zip/,
    fullRegex = /NPPES_Data_Dissemination_[a-zA-Z]+_\d+.zip/,
    npiIndexOptions = {
      host: 'nppes.viva-it.com',
      port: 80,
      path: '/NPI_Files.html'
    };

module.exports = function () {

};

module.exports.prototype = {
  currentFullID: function () {

  },
  currentWeeklyIDs: function () {

  },
  fetchFull: function () {

  },
  fetchWeekly: function (id) {

  }
};
