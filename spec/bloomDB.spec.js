var bloomDB = require('../lib/bloomDB'),
    Sequelize = require('sequelize');

describe('bloomDB', function () {
  it('converts a schema to a sequelize model', function () {
    var model = bloomDB.schemaToSequelize({
      "id": {
        composite: [
          'hello'
        ]
      },
      "joe": {
        named: "shmo",
        type: "string/50"
      },
      "other": {
        named: /other/,
        type: "string"
      }
    });

    expect(model).toEqual({
      "id": Sequelize.STRING(32),
      "joe": Sequelize.STRING(50),
      "other": Sequelize.STRING
    });
  });

  it('provides a safe name', function () {
    var names = [
      ['Hello World4', 'hello_world4'],
      ['U.S. (Only if things)', 'u_s_only_if_things'],
      ['joe', 'joe'],
      ['HelloWorld', 'helloworld']
    ];

    names.forEach(function (namePair) {
      expect(bloomDB.safeName(namePair[0])).toEqual(namePair[1]);
    });
  });

  it('provides safe names', function () {
    expect(bloomDB.safeNames(['O', 'Q'])).toEqual(['o', 'q']);
  });
});
