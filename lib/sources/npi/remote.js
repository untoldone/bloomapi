var remoteFile = require('./remoteFile'),
    weeklyRegex = /http\:\/\/.*(NPPES_Data_Dissemination_\d+_\d+_Weekly).zip/g,
    monthlyRegex = /http\:\/\/.*(NPPES_Data_Dissemination_[a-zA-Z]+_\d+).zip/,
    ignore = /<\!\-\-(.|\n)*?\-\-\>/g;

module.exports = {
  fetchSources: function () {
    return remoteFile.fetch("http://nppes.viva-it.com/NPI_Files.html")
      .then(function (file) {
        var remotes = [],
            match;

        file = file.replace(ignore, '');
        
        match = monthlyRegex.exec(file);

        if (match) {
          remotes.push({
            name: match[1],
            url: match[0],
            type: 'monthly'
          });
        }

        while (match = weeklyRegex.exec(file)) {
          remotes.push({
            name: match[1],
            url: match[0],
            type: 'weekly'
          });
        }

        return remotes;
      });
  }
}
