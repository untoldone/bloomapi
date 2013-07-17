var splitDigit = /^([^\d]+)\d+$/;

var npiFields = module.exports = function (schema, meta) {
  var expandedMeta = this.expandedMeta = {},
      expandable = /^([^\s]+)\{(\d+)\-(\d+)\}$/,
      that = this;


  this.schema = schema;
  this.fields = [];

  this.schema.forEach(function (elm) {
    that.fields.push(elm.name);
  });

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
        expandedMeta[template + i].setMax = end;
      }
    } else {
      expandedMeta[key] = meta[key];
    }
  }
};

npiFields.prototype = {
  columns: function () {
    return this.fields;
  },
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
  unmappedValue: function (name, value) {
    var info = this.nameToInfo(name);

    if (info) {
      var meta;
      if (typeof info == 'object') {
        meta = this.expandedMeta[info[0]];
      } else {
        meta = this.expandedMeta[info];
      }

      if (meta.map) {
        for (var key in meta.map) {
          if (meta.map[key] === value) {
            return key;
          }
        }

        return undefined;
      } else {
        return value;
      }
    } else {
      return undefined;
    }
  },
  nameToInfo: function (name) {
    var parts = name.split('.');

    if (parts.length === 1) {
      for(var key in this.expandedMeta) {
        if ((!this.expandedMeta[key] || !this.expandedMeta[key].rename) && key === parts[0]) {
          return key;
        } else if (this.expandedMeta[key] && this.expandedMeta[key].rename === parts[0] && !this.expandedMeta[key].key) {
          return key;
        }
      }

      return undefined;
    } else if (parts.length === 2) {
      for(var key in this.expandedMeta) {
        if (this.expandedMeta[key] && 
            this.expandedMeta[key].key === parts[0] &&
            this.expandedMeta[key].rename ===  parts[1]) {
          if (this.expandedMeta[key].set) {
            var match = splitDigit.exec(key),
                result = [];
            for (var i = 1; i < this.expandedMeta[key].setMax + 1; i++) {
              result.push(match[1] + i);
            }
            return result;
          } else {
            return key;
          }
        }
      }

      return undefined;
    } else {
      return undefined;
    }
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
