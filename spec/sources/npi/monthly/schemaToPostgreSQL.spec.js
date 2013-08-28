var stp = require('../../../../lib/sources/npi/monthly/schemaToPostgreSQL.js');

describe('SchemaToPostgreSQL', function () {
  describe('importSchema', function () {
    var converter, demo;
    beforeEach(function () {
      converter = stp;
      demo = {
        name: 'field',
        type: 'NUMBER',
        length: 6,
        description: "nothing in particular"
      };
    });

    it('should convert varchar', function () {
      demo.type = "VARCHAR";
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis_temp (field  varchar(6));');
    });

    it('should convert smallint', function () {
      demo.length = 2;
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis_temp (field  smallint);');
    });

    it('should convert integer', function () {
      demo.length = 9;
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis_temp (field  integer);');
    });

    it('should convert bigint', function () {
      demo.length = 10;
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis_temp (field  bigint);');
    });

    it('should convert date', function () {
      demo.length = 10;
      demo.type = "DATE";
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis_temp (field  date);');
    });

    it('should raise on unknown type', function () {
      demo.type = "unknown";
      expect(function () {
        converter.importSchema([demo]);
      }).toThrow();
    });

    it('should mark npi as primary key', function () {
      demo.length = 10;
      demo.name = "npi";
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis_temp (npi  bigint PRIMARY KEY);');
    });

  });
});
