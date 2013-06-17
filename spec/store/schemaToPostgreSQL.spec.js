var stp = require('../../lib/store/schemaToPostgreSQL.js');

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
      expect(result).toEqual('CREATE TABLE npis (field  varchar(6));');
    });

    it('should convert smallint', function () {
      demo.length = 2;
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis (field  smallint);');
    });

    it('should convert integer', function () {
      demo.length = 9;
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis (field  integer);');
    });

    it('should convert bigint', function () {
      demo.length = 10;
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis (field  bigint);');
    });

    it('should convert date', function () {
      demo.length = 10;
      demo.type = "DATE";
      var result = converter.importSchema([demo]);
      expect(result).toEqual('CREATE TABLE npis (field  date);');
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
      expect(result).toEqual('CREATE TABLE npis (npi  bigint PRIMARY KEY);');
    });

    it('should format field name', function () {
      // rules:
      //  all to lower case
      //  convert '(', ')', '.' and white space to '_'
      //  shorten multiple '_' in a row to single '_'
      //  trim _ from beginning and end
      demo.name = " Hello (World.U.S.) Something.";
      var result = converter.importSchema([demo]);
      var match = /\(([^\s]+).+\)/.exec(result);
      var name = match[1];
      expect(name).toEqual('hello_world_u_s_something');
    });
  });
});
