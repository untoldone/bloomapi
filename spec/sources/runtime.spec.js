var rewire = require('rewire'),
    Runtime = rewire('../../lib/sources/runtime');

describe('sources/runtime', function () {
  var fakeFirst, fakeExec, fakeSecond, fakeSExec, fakeFirstCalled, fakeSecondCalled;

  beforeEach(function () {
    fakeFirstCalled = 0;
    fakeSecondCalled = 0;
    fakeFirst = function () {};
    fakeExec = function (data, callback) { 
      fakeFirstCalled += 1;
      callback(null, "joe");
    };
    fakeSecond = function (context) {
      this.context = context; 
    };
    fakeSExec = function (data, callback) { 
      fakeSecondCalled += 1;
      expect(this.context.hello).toEqual("joe");
      callback(null, null);
    };

    fakeFirst.prototype = { execute: fakeExec };
    fakeSecond.prototype = { execute: fakeSExec };

    var fakeParser = function (context) { this.context = context; };
    fakeParser.prototype = {
      parse: function (obj) {
        if (Object.keys(obj)[0] == 'first') {
          return {
            action: fakeFirst,
            parameters: { hello: "world", set: "result" }
          }
        } else {
          return {
            action: fakeSecond,
            parameters: { hello: "joe" }
          }
        }
      }
    }

    Runtime.__set__('Parser', fakeParser);
  });

  it('runs a action', function (done) {
    var source, runtime;

    source = [ {'first': 'hello=world'} ];

    runtime = new Runtime(source);

    runtime.execute(function (err, context) {
      expect(fakeFirstCalled).toEqual(1);
      done();
    });
  });

  it('sets the result of an action', function (done) {
    var source, runtime;

    source = [ {'first': 'hello=world set=result'},
               {'second': 'hello={{result}}'} ];

    runtime = new Runtime(source);

    runtime.execute(function (err, context) {
      expect(context.result).toEqual('joe');
      expect(fakeSecondCalled).toEqual(1);
      done();
    });
  });
});
