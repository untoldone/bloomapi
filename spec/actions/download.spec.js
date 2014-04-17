var rewire = require('rewire'),
    Download = rewire('../../actions/download'),
    stream = require('stream'),
    util = require('util'),
    sinon = require('sinon');

describe('actions/download', function () {
  it('should request with no file', function (done) {
    var download,
        fakeRequest = sinon.spy(function (url) {
          return "hello";
        });

    Download.__set__('request', fakeRequest);

    download = new Download({
      url: 'http://www.joe.com/junk'
    });

    download.execute(null, function (err, data) {
      expect(fakeRequest.calledWith('http://www.joe.com/junk')).toEqual(true);
      expect(data).toEqual("hello");
      done();
    });
  });

  it('should write the file with file', function (done) {
    var download,
        w,
        fakeRequest = sinon.spy(function (url) {
          var r = new stream.Readable();
          r.push('hello');
          r.push(null);
          return r;
        }),
        fakeFs = {
          createWriteStream: function (fileName) {
            return w;
          }
        };

    function TestWritable () {
      stream.Writable.call(this);
    }

    util.inherits(TestWritable, stream.Writable);
    
    TestWritable.prototype._write = function (chunk, encoding, callback) {
      expect(chunk.toString()).toEqual('hello');
      callback();
    };

    w = new TestWritable;

    Download.__set__('fs', fakeFs);
    Download.__set__('request', fakeRequest);

    download = new Download({
      url: 'http://www.joe.com/junk',
      file: 'hello'
    });
    
    download.execute(null, function (err, data) {
      expect(fakeRequest.calledWith('http://www.joe.com/junk')).toEqual(true);
      done();
    });
  });
});
