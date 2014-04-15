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
        ],
        result: [
          ["string", "string"],
          ["integer", "integer"],
          ["bigint", "bigint"],
          ["float", "float"],
          ["date", "date"],
          ["boolean", "boolean"],
          ["string", "string"]
        ]
      };

    function getAutodetect() {
      var rowStream = new Readable({objectMode: true}),
          autodetect = new Autodetect(rowStream);

      rowStream.push(fixture.columns);
      
      fixture.rows.forEach(function (row) {
        rowStream.push(row);
      });
      rowStream.push(null);
      
      return autodetect;
    }

    it('should autodetect fields', function (done) {
      var autodetect = getAutodetect();
      autodetect.detect(function (err, results) {
        results.forEach(function (result, index) {
          expect(result).toEqual(fixture.result[index]); 
        });
        done();
      });

    });

    it('should have a lookup for types', function (done) {
      var autodetect = getAutodetect();
      autodetect.detect(function (err, results) {
        expect(results.keyToType('float')).toEqual('float');
        expect(results.keyToType('bigint')).toEqual('bigint');
        done();
      });
    });
  });
