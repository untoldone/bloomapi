var Q = require('q');

function isNumeric(value) {
  return value - 0 == value;
}

module.exports = {
  split: function (content) {
    return content.split("\n");
  },

  trimUnused: function (lines) {
    var len = lines.length,
        startIndex,
        endIndex,
        i;
    
    for(i = 0; i < len; i++) {
      if (/Data\sDissemination\sNotice$/.exec(lines[i])) {
        startIndex = i + 1;
        break;
      }
    }

    for(i = len - 1; i >= 0; i--) {
      if (/^NPPES\sData\sDissemination\s\-\sReadme/.exec(lines[i])) {
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
      if (!startIndex && /^NPPES\sData\sDissemination\s\-\sReadme/.exec(lines[i])) {
        startIndex = i
      }

      if (startIndex && /Data\sDissemination\sNotice$/.exec(lines[i])) {
        // Store chunks to be removed including either end of chunk
        chunks.push([startIndex, (i - startIndex + 1)]);
        startIndex = null;
      }
    }

    // remove chunks
    chunks.reverse().forEach(function (chunk) {
      lines.splice(chunk[0], chunk[1]);
    });

    // remove empty lines
    for(i = lines.length - 1; i >= 0; i--) {
      if (lines[i] === '') {
        lines.splice(i, 1);
      }
    }

    return lines;
  },

  toSchema: function (lines) {
    var len = lines.length,
        schema = [],
        i, extraName, extraDesc,
        extra = /^(([^\s]\s?)+)?(\s{2,}(([^\s]\s?)+))?$/,
        line = /^(([^\s]+[\s])+)\s{2,}(\d+|10\s\(MM\/DD\/YYYY\))\s{2,}([^\s]+)(\s{2,}(([^\s]+[\s]?)+))?$/,
        match,
        name, length, type, desc, obj;

    for (i = len - 1; i >= 0; i--) {
      if(match = extra.exec(lines[i])) {
        if (match[1]) extraName = match[1].trim();
        if (match[4]) extraDesc = match[4].trim();
      } else if (match = line.exec(lines[i])) {
        name = match[1].trim();
        length = match[3].trim();
        type = match[4].trim();
        if (match[6]) desc = match[6].trim();
        obj = {
          name: name,
          length: length,
          type: type
        };
        if (extraName) obj.name += " " + extraName;
        if (desc) obj.desc = desc;
        if (desc && extraDesc) {
          obj.description += " " + extraDesc;
        } else if (extraDesc) {
          obj.description = extraDesc;
        }

        extraName = null;
        extraDesc = null;
        desc = null;
        schema.push(obj);
      }
    }

    return schema.reverse();
  }
};
