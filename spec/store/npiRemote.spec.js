var NPIRemote = require('../../lib/store/npiRemote');

describe('NPIRemote', function () {
  var remote = new NPIRemote();

  describe('currentFullID', function () {
    it('should describe the current Full remote dissemination', function (done) {
      remote.currentFullID().then(function (value) {
        expect(value).toNotEqual(null); 
        done();
      }).fail(function (error) {
        expect(error).toEqual(null);
        done();
      });
    });
  });

  describe('currentWeeklyIDs', function () {
    xit('should describe the current Weekly disseminations', function (done) {
      throw 'pending';
    });
  });

  describe('fetchFull', function () {
    xit('should fetch the current full dissemination', function (done) {
      throw 'pending';
    });
  });

  describe('fetchWeekly', function () {
    xit('should fetch an available weekly dissemination', function (done) {
      throw 'pending';
    });
    
    xit('should call error on an invalid weekly dissemination', function (done) {
      throw 'pending';
    });
  });
});
