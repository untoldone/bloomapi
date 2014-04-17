var rewire = require('rewire'),
    Runtime = rewire('../../lib/sources/runtime');

describe('sources/runtime', function () {
  var sample = {
        npi: {
          variables: {
            name: "Joe"
          },
          sequences: {
            one: {
              message: "Hello, {{Joe}}"
            }
          }
        }
      },
      execCalled, seq, exec;
      

  beforeEach(function () {
    execCalled = 0;
    seq = function (c) {
      expect(c).toEqual({ name: "Joe" }); 
    };

    seq.prototype = {
      execute: function (callback) {
        execCalled += 1;
        callback();
      }
    };


    Runtime.__set__("Sequence", seq);
  });

  it('should execute a given sequence', function (done) {
    var runtime = new Runtime(sample);

    runtime.execute("one", function (err) {
      expect(execCalled).toEqual(1);
      done();
    });
  });
});
