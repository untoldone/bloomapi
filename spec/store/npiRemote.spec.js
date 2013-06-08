var NPIRemote = require('../../lib/store/npiRemote'),
    http = require('http'),
    fakeGet = require('../fakeHttpGet');

describe('NPIRemote', function () {
  var remote = new NPIRemote(),
      get;

  beforeEach(function () {
    get = http.get;
    fakeGet.content = "<one>http://something/NPPES_Data_Dissemination_j_1.zip</one>";
    http.get = fakeGet;
  });

  afterEach(function () {
    http.get = get;
  });

  describe('currentFullID', function () {
    it('should describe the current Full remote dissemination', function (done) {
      remote.currentFullID().then(function (value) {
        http.get = get;
        expect(value).toNotEqual(null); 
        done();
      }).fail(function (error) {
        http.get = get;
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
