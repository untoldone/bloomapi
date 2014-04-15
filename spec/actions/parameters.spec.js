var Parameters = require('../../lib/actions/parameters');

describe('actions/parameters', function () {
  it('should parse one string parameter', function () {
    var parameters = new Parameters(),
        results;
    
    results = parameters.parse("   hello=world   ");

    expect(results).toEqual({
      "hello": "world"
    });
  });

  it('should parse two string parameters', function () {
    var parameters = new Parameters(),
        results;
    
    results = parameters.parse("  hello=world    one=http://www.hello.com/q=hello%20world   ");

    expect(results).toEqual({
      "hello": "world",
      "one": "http://www.hello.com/q=hello%20world"
    });
  });

  it('should parse object parameters', function () {
    var parameters = new Parameters(),
        results;
    
    results = parameters.parse({
      "hello": "world" 
    });

    expect(results).toEqual({
      "hello": "world"
    });
  });

  it('should replace a variable in a string', function () {
    var parameters = new Parameters({"world": "joe"}),
        results;

    results = parameters.parse("hello={{world}}");

    expect(results).toEqual({
      "hello": "joe"
    });
  });

  it('should replace a variable in an object', function () {
    var parameters = new Parameters({"world": "joe"}),
        results;

    results = parameters.parse({
      "hello": "{{world}}"
    });

    expect(results).toEqual({
      "hello": "joe"
    });
  });
});
