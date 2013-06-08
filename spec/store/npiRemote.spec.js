var NPIRemote = require('../../lib/store/npiRemote'),
    http = require('http'),
    fakeGet = require('../fakeHttpGet');

describe('NPIRemote', function () {
  var remote = new NPIRemote(),
      get;

  beforeEach(function () {
    get = http.get;
    fakeGet.content = "<one>http://something/NPPES_Data_Dissemination_j_1.zip</one><two>http://something/NPPES_Data_Dissemination_112233_223344_Weekly.zip</two><two>http://something/NPPES_Data_Dissemination_334455_667788_Weekly.zip</two>";
    http.get = fakeGet;
  });

  afterEach(function () {
    http.get = get;
  });

  describe('currentFullID', function () {
    it('should describe the current Full remote dissemination', function (done) {
      remote.currentFullID().then(function (value) {
        expect(value).toEqual('j_1'); 
        done();
      }).fail(function (error) {
        expect(false).toEqual(true);
        done();
      });
    });
  });

  describe('currentWeeklyIDs', function () {
    it('should describe the current Weekly disseminations', function (done) {
      remote.currentWeeklyIDs().then(function (value) {
        expect(value).toEqual(['112233_223344', '334455_667788']);
        done();
      }).fail(function (error) {
        expect(false).toEqual(true);
        done();
      });
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
