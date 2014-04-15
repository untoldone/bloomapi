var Autodetect = require('../../lib/sources/autodetect'),
    Readable = require('stream').Readable;

describe('sources/autodetect', function () {
  var fixture = {
        columns: [
          "string",
          "integer",
          "bigint",
          "float",
          "date",
          "boolean",
          "string"
          // "text" -- missing to make file shorter
        ],
        rows: [
          ["", "-2", "", "", "", "false", ""],
          ["", "", "", "", "", "", ""],
          [null, null, null, null, null, null],
          ["hello", "1", "1234567890123", "1.2", "12/15/1986", "true", ""]
        ]
      };

    it('should autodetect fields', function (done) {
      var autodetect = new Autodetect(fixture.columns),
          rowStream = new Readable({objectMode: true});
      
      fixture.rows.forEach(function (row) {
        rowStream.push(row);
      });
      rowStream.push(null);
      
      autodetect.detect(rowStream, function (err, results) {
        expect(results).toEqual(fixture.columns);
        done();
      });

    });
  });
