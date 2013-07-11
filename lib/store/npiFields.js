var npiFields = module.exports = function (meta) {
  var expandable = /^([^\s]+)\{(\d+)\-(\d+)\}$/,
      expandedMeta = this.expandedMeta = {};

  for (var key in meta) {
    // preprocess metadata to 'expand' array metadata items
    var match;
    if (match = expandable.exec(key)) {
      var template = match[1],
          start = parseInt(match[2]),
          end = parseInt(match[3]);
      for (var i = start; i < end + 1; i++) {
        expandedMeta[template + i] = {};
        for (var k in meta[key]) {
          expandedMeta[template + i][k] = meta[key][k];
        }
        expandedMeta[template + i].set = i;
      }
    } else {
      expandedMeta[key] = meta[key];
    }
  }
};

npiFields.prototype = {
  indices: function () {
    var idxs = {};

    for (var key in this.expandedMeta) {
      var meta = this.expandedMeta[key],
          idx;
      if (meta) idx = meta.index;
      if (idx) idxs[idx] = key;
    }
    
    return idxs;
  },
  keyToName: function (key) {
    var rename = this.expandedMeta[key].rename;
    return rename || key;
  },
  mappedValue: function (key, value) {
    var map = this.expandedMeta[key].map;
    return map ? map[value] : value;
  },
  transformField: function (key, value, dest) {
    var meta = this.expandedMeta[key];
    if (meta) {
      // there is metadata for this field
      var tkey = this.keyToName(key),
          tvalue = this.mappedValue(key, value);

      if (meta.key) {
        // placement on a sub-object
        if (meta.set) {
          // destination object is an array
          var set = dest[meta.key] = (dest[meta.key] || []);
          if (set.length < meta.set) {
            // ensure enough objects exist in the array such that the current 'index' of the field can be written
            for (var i = 0; i <= (meta.set - set.length); i++) {
              set.push({});
            }
          }

          set[meta.set - 1][tkey] = tvalue;
        } else {
          if (!dest[meta.key]) dest[meta.key] = {};
          dest[meta.key][tkey] = tvalue;
        }
      } else {
        dest[tkey] = tvalue;
      }
    } else {
      dest[key] = value;
    }
  },
  processRecord: function (record) {
    var trecord = {};

    for (var key in record) {
      this.transformField(key, record[key], trecord);
    }

    return trecord;
  },
  process: function (records) {
    var transformed = [],
        that = this;

    records.forEach(function (record) {
      transformed.push(that.processRecord(record));
    });

    return transformed;
  }
}
