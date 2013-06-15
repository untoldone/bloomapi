var fs = require('fs'),
    Q = require('q');

function isNumeric(value) {
  return value - 0 == value;
}

module.exports = {
  loadFile: function (path) {
    var deferred = Q.defer();

    fs.readFile(path, 'utf8', function (err, data) {
      if (err) deferred.reject(new Error(err));
      deferred.resolve(data);
    });

    return deferred.promise;
  },

  split: function (content) {
    return content.split("<br>\n");
  },

  trimUnused: function (lines) {
    var len = lines.length,
        startIndex,
        endIndex,
        i;
    for(i = 0; i < len; i++) {
      if (lines[i] === 'Data Dissemination Notice') {
        startIndex = i + 1;
        break;
      }
    }

    for(i = len - 1; i >= 0; i--) {
      if (lines[i] === 'NPPES Data Dissemination - Readme') {
        endIndex = i;
        break;
      }
    }
   
    if (!startIndex) {
      throw 'Instance of "Data Dissemination Notice" not found';
    }
    
    if (!endIndex) {
      throw 'Instance of "NPPES Data Dissemination - Readme" not found';
    }

    if (startIndex > endIndex) {
      throw 'Unexpected positioning of lines that identify beginning and end of schema';
    }

    return lines.slice(startIndex, endIndex);
  },

  removeBreaks: function (lines) {
    var i = 0,
        chunks = [],
        len = lines.length,
        startIndex;

    // Indentify chunks to remove
    for (; i < len; i++) {
      if (!startIndex && lines[i] === 'NPPES Data Dissemination - Readme') {
        startIndex = i
      }

      if (startIndex && lines[i] === 'Data Dissemination Notice') {
        // Store chunks to be removed including either end of chunk
        chunks.push([startIndex, (i - startIndex + 1)]);
        startIndex = null;
      }
    }

    // remove chunks
    chunks.reverse().forEach(function (chunk) {
      lines.splice(chunk[0], chunk[1]);
    });

    return lines;
  },
  
  toSchema: function (lines) {
    var len = lines.length,
        schema = [],
        i,
        type, length, description;
    for (i = len - 1; i >= 0; i--) {
      if (!description && !type) {
        description = lines[i];
      } else if (length) {
        var item = {
          name: lines[i],
          type: type,
          length: length
        };

        if (description) item.description = description;

        schema.push(item);

        type = length = description = null;
      } else if (isNumeric(lines[i]) || lines[i] === '10 (MM/DD/YYYY)') {
        if (!type) {
          type = description;
          description = null;
        }

        length = lines[i];
      } else {
        type = lines[i];  
      }
    }

    return schema.reverse();
  }
};
