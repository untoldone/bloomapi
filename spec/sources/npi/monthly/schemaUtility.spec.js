var schemaUtility = require('../../../../lib/sources/npi/monthly/schemaUtility'),
    schemaFixture = require('./schemaUtilityFixture'),
    fakeFSReadFile = require('../../../fakeFSReadFile'),
    fs = require('fs');

describe('SchemaUtility', function () {
  var readFile;

  beforeEach(function () {
    readFile = fs.readFile;
    fakeFSReadFile.data = schemaFixture.full;
    fs.readFile = fakeFSReadFile;
  });

  afterEach(function () {
    fs.readFile = readFile;
  });

  it ('should split a file by <br />', function () {
    var lines = schemaUtility.split(schemaFixture.toSplit);
    expect(lines).toEqual(schemaFixture.toSplitExpected);
  });

  it ('should trim unused lines at the beginning and end', function () {
    var lines = schemaFixture.toTrim.slice(0);
    lines = schemaUtility.trimUnused(lines);
    expect(lines).toEqual(schemaFixture.toTrimExpected);
  });

  it ('should remove page break and table headers', function () {
    var lines = schemaFixture.toRemoveBreaks.slice(0);
    lines = schemaUtility.removeBreaks(lines);
    expect(lines).toEqual(schemaFixture.toRemoveBreaksExpected);
  });

  it ('should convert cleaned documentation to json schema', function () {
    var lines = schemaFixture.toSchema.slice(0),
        schema;
    schema = schemaUtility.toSchema(lines);
    expect(schema).toEqual(schemaFixture.toSchemaExpected);
  });
});
