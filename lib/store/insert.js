var Q = require('q'),
    fs = require('fs'),
    pg = require('./pg'),
    stp = require('./schemaToPostgreSQL'),
    insert = function (path) {
      this.path = path;
    };

var records = 0;

insert.prototype = {
  fieldsReady: function () {
    var that = this;

    return this.linesReady().then(function () {
      var index = that.stringBuffer.indexOf("\n"),
          fieldLine = that.stringBuffer.slice(0, index),
          fields = [];

      fieldLine = fieldLine.replace(/\"/g, '');
      
      fieldLine.split(',').forEach(function (elm) {
        fields.push(stp.fieldName(elm));
      });

      that.stringBuffer = that.stringBuffer.slice(index + 1);

      that.fields = fields.join(',');
    });
  },

  linesReady: function () {
    var deferred = Q.defer(),
        chunk = this.readStream.read(),
        that = this;

    if (chunk) {
      this.stringBuffer += chunk;
      if (chunk.indexOf("\n") !== -1) {
        return Q.fcall(function () {
          deferred.resolve();
        });
      }
    } else {
      var callback = function () {
        chunk = that.readStream.read();
        that.stringBuffer += chunk;
        if (chunk.indexOf("\n") !== -1) {
          that.readStream.removeListener('readable', callback);
          deferred.resolve();
        }
      };
      this.readStream.on('readable', callback);
    }

    return deferred.promise;
  },

  lastLinesInserted: function () {
    var deferred = Q.defer(),
        buf = this.stringBuffer,
        index = buf.lastIndexOf("\n"),
        completed = buf.slice(0, index),
        query = "INSERT INTO npis (" + this.fields + ") VALUES (",
        that = this;
    this.stringBuffer = buf.slice(index + 1);

    completed = completed.replace(/\"\"/g, 'NULL');
    completed = completed.replace(/'/g, "''");
    completed = completed.replace(/\"/g, "'");
    completed = completed.split("\n");

    records += completed.length;
    console.log('writing: ' + completed.length + ' records, ' + records + ' total');
    query += completed.join('), (') + ');';

    pg.query(query, function (err, result) {
      if (err) {
        return deferred.reject(new Error(err));
      }

      if (that.fileCompleted) that.completed = true;

      deferred.resolve();
    });

    return deferred.promise;
  },

  exec: function () {
    var deferred = Q.defer(),
        readStream = fs.createReadStream(this.path, {encoding: 'utf8'}),
        stringBuffer = "",
        that = this;

    this.readStream = readStream;
    this.stringBuffer = stringBuffer;
    this.completed = false;
    this.fileCompleted = false;

    readStream.on('end', function () {
      that.fileCompleted = true;
    });

    var promise = this.fieldsReady();

    var readWrite = function () {
      if (!that.completed) {
        return promise.then(function () {
          return that.linesReady();
        }).then(function () {
          return that.lastLinesInserted();
        }).then(readWrite);
      } else {
        return;
      }
    };

    return promise.then(readWrite);
  }
};

module.exports = insert;
