var Parser = require('../../lib/actions/parser'),
    Download = require('../../actions/download'),
    FixNpi = require('../../sources/npi/actions/fix_npi');

describe('actions/parser', function () {
  it('should return an action', function () {
    var parser = new Parser({ one: "world" }),
        results;

    results = parser.parse({
      download: "url=http://www.hello.com/q={{one}}"
    });

    expect(results.action === Download).toEqual(true);
    expect(results.parameters).toEqual({
      url: "http://www.hello.com/q=world"
    });
  });

  it('should return a custom action when used', function () {
    var parser = new Parser({ one: "world", dir: __dirname + "/../../sources/npi" }),
        results;

    results = parser.parse({
      fix_npi: "url=http://www.hello.com/q={{one}}"
    });

    expect(results.action === FixNpi).toEqual(true);
    expect(results.parameters).toEqual({
      url: "http://www.hello.com/q=world"
    });
  });
});
