var types = {
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
},
  priority = [
    "boolean",
    "date",
    "integer",
    "bigint",
    "float",
    "string",
    "text"
  ]

module.exports = function (columns) {
  this.columns = columns.map(function (column) {
    return { name: column, priority: -1 };
  }, {});
};

module.exports.prototype = {
  detect: function (source, callback) {
    var self = this;

    source.on('data', function (row) {
      row.forEach(function (column, index) {
        var currentPri, currentReg;
        
        if (column === null || column === "") return;
        
        currentPri = self.columns[index].priority;
        if (currentPri === -1) currentPri = self.columns[index].priority = 0;
        
        currentReg = types[priority[currentPri]];


        while (!(typeof currentReg === 'function' ? currentReg(column) : column.match(currentReg))) {
          currentPri = self.columns[index].priority += 1;
          currentReg = types[priority[currentPri]];
        }
      });
    });

    source.on('end', function () {
      var columns = self.columns.map(function (column) { 
        return column.priority === -1 ? "string" : priority[column.priority];
      });
      callback(null, columns);
    });

    source.on('error', function (err) {
      callback(err, null);
    });
  }
};
