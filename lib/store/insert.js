var Q = require('q'),
    fs = require('fs'),
    pg = require('./pg'),
    stp = require('./schemaToPostgreSQL'),
    insert = function (path) {
      this.path = path;
    };

var records = 0, printed = 0;

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
        index = buf.lastIndexOf("\n") + 1,
        completed = buf.slice(0, index),
        query = "COPY npis (" + this.fields + ") FROM STDIN CSV DELIMITER ',';",
        that = this;

    if (!this.copyStream) {
      this.copyStream = pg.copyFrom(query);
    }

    this.stringBuffer = buf.slice(index);

    completed = completed.replace(/""/g, '');
    var count = completed.match(/\n/g);
    records += count.length;
    if (10000 * Math.round(records / 10000.0) > printed) {
      printed = 10000 * Math.round(records / 10000.0);
      console.log('recorded: ' + printed);
    }
 
    var callback = function () {
      deferred.resolve();
      that.copyStream.removeListener('drain', callback);
    }
    var result = this.copyStream.write(completed);
    if (result === false) {
      this.copyStream.on('drain', callback);
    } else {
      setTimeout(function () {
        if (this.fileCompleted) {
          this.completed = true;
        }
        deferred.resolve();
      });
    }

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
        var deferred = Q.defer();
        that.copyStream.end();
        that.copyStream.on('close', function () {
          deferred.resolve(); 
        });
        that.copyStream.on('error', function (error) {
          deferred.reject(new Error(error));
        });

        return deferred.promise;
      }
    };

    return promise.then(readWrite);
  }
};

module.exports = insert;
