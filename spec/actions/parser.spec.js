var Parser = require('../../lib/actions/parser'),
    Download = require('../../actions/download');

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
});
