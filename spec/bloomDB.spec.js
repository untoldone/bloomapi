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
});
