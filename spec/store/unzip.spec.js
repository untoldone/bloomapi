var z = require('../../lib/store/unzip'),
    child_process = require('child_process'),
    fakeChildProcessExec = require('../fakeChildProcessExec'),
    exec;

describe('Unzip', function () {
  beforeEach(function () {
    exec = child_process.exec;
    child_process.exec = fakeChildProcessExec;
  });

  afterEach(function () {
    child_process.exec = exec;
  });

  it('should unzip', function (done) {
    fakeChildProcessExec.command = "7z e data/hello.zip -y -odata/test";
    z.unzip('data/hello.zip', 'data/test')
      .fail(function (error) {
        console.log(error.message);
        expect(error.message).toEqual("Exit code 0");
      }).done(function () {
        done();
      });
  });
});
