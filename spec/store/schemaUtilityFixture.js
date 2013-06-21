var fs = require('fs');

module.exports = {
  full: fs.readFileSync('./spec/store/schemaUtilityFixtureRaw.html', 'utf8'),
  toSplit: "Hello\nWorld\nTheOther",
  toSplitExpected: ["Hello", "World", "TheOther"],
  toTrim: ["Hello","Data Dissemination Notice", "data1", "data2", "NPPES Data Dissemination - Readme", "Data Dissemination Notice", "data3", "NPPES Data Dissemination - Readme", "World"],
  toTrimExpected: ["data1", "data2", "NPPES Data Dissemination - Readme", "Data Dissemination Notice", "data3"],
  toRemoveBreaks: ['data1', 'NPPES Data Dissemination - Readme', 'junk', 'Data Dissemination Notice', 'data2'],
  toRemoveBreaksExpected: ['data1', 'data2'],
  toSchema: ['NPI   10   NUMBER', '    Hello World', 'Some Date   10 (MM/DD/YYYY)  DATE'],
  toSchemaExpected: [
    {
      'name': 'NPI',
      'type': 'NUMBER',
      'length': '10',
      'description': 'Hello World'
    },
    {
      'name': 'Some Date',
      'type': 'DATE',
      'length': '10 (MM/DD/YYYY)'
    }
  ]
};
