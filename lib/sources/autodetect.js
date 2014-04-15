var types,
  priority;

priority = [
    "boolean",
    "date",
    "integer",
    "bigint",
    "float",
    "string",
    "text"
  ];

types = {
      "boolean": function (q) {
        return q === "true" || q === "false";
      },
      "date": /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      "integer": function (q) {
        var n = Number(q);
        var f = parseInt(q);
        return !isNaN(n) && n === f && n < 2147483647 && n > -2147483648
      },
      "bigint": function (q) {
        var n = Number(q);
        var f = parseInt(q);
        return !isNaN(n) && n === f && n < 9223372036854775807 && n > -9223372036854775808
      },
      "float": function (q) {
        var f = parseFloat(q);
        return !isNaN(q) && f.toString() === q;
      },
      "string": function (q) { return q.length < 255; },
      "text": function (q) { return true; }
    };

module.exports = function (source) {
  source.pause();

  this.source = source;
};

module.exports.prototype = {
  columns: function (columns) {
    if (columns) {
      this._columns = columns.map(function (column) {
        return { name: column, priority: -1 };
      }, {});
    } else {
      return this._columns;
    }
  },
  detect: function (callback) {
    var self = this;

    this.source.on('data', function (row) {
      if (!self.columns()) {
        self.columns(row);
      } else {
        row.forEach(function (column, index) {
          var columns = self.columns(),
              currentPri, currentReg;
          
          if (column === null || column === "") return;
          
          currentPri = columns[index].priority;
          if (currentPri === -1) currentPri = columns[index].priority = 0;
          
          currentReg = types[priority[currentPri]];

          while (!(typeof currentReg === 'function' ? currentReg(column) : column.match(currentReg))) {
            currentPri = columns[index].priority += 1;
            currentReg = types[priority[currentPri]];
          }
        });
      }
    });

    this.source.on('end', function () {
      var columns = self.columns().map(function (column) { 
        return [column.name, column.priority === -1 ? "string" : priority[column.priority]];
      }),
          m = columns.reduce(function (sum, column) {
            sum[column[0]] = column[1];
            return sum;
          }, {});

      columns.keyToType = function (key) {
        return m[key];
      };

      callback(null, columns);
    });

    this.source.on('error', function (err) {
      callback(err, null);
    });
    
    this.source.resume();
  }
};
