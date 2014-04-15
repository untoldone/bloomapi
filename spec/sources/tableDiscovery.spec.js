var fs = require('fs'),
    TableDiscovery = require('../../lib/sources/tableDiscovery'),
    Sequelize = require('sequelize'),
    split = require('split'),
    through = require('through'),
    csv = require('csvrow');

describe('sources/tableDiscovery', function () {
  var discoverableSchema = {
    id: {
      composite: [
        'shmo'
      ]
    },
    joe: 'shmo'
  };

  var nonDiscoverableSchema = {
    id: {
      composite: [
        'shmo'
      ]
    },
    joe: {
      named: 'shmo',
      type: 'string/60'
    }
  };

  var correctSchema = {
    id: Sequelize.STRING(32),
    joe: Sequelize.STRING
  };
  
  var correctSpecifiedSchema = {
    id: Sequelize.STRING(32),
    joe: Sequelize.STRING(60)
  };

  it('should decide if a table needs discovery', function () {
    var hintPipe, tableDiscovery;
    
    hintPipe = fs.createReadStream(__dirname + "/../fixtures/discoveryHint.csv")
      .pipe(split())
      .pipe(through(function (data) {
        this.queue(csv.parse(data)); 
      }));
    tableDiscovery = new TableDiscovery(discoverableSchema, hintPipe);


    expect(tableDiscovery.requiresHint()).toEqual(true);
    
    tableDiscovery = new TableDiscovery(nonDiscoverableSchema, hintPipe);
    expect(tableDiscovery.requiresHint()).toEqual(false);
  });

  it('should discover the correct schema', function (done) {
    var hintPipe, tableDiscovery;
    
    hintPipe = fs.createReadStream(__dirname + "/../fixtures/discoveryHint.csv")
      .pipe(split())
      .pipe(through(function (data) {
        this.queue(csv.parse(data)); 
      }));
    tableDiscovery = new TableDiscovery(discoverableSchema, hintPipe);
    
    tableDiscovery.schema(function (err, schema) {
      expect(schema).toEqual(correctSchema);
      done();
    });
  });
  
  it('should use the schema specified', function (done) {
    var hintPipe = fs.createReadStream(__dirname + "/../fixtures/discoveryHint.csv"),
      tableDiscovery = new TableDiscovery(nonDiscoverableSchema, hintPipe);
   
    tableDiscovery.schema(function (err, schema) {
      expect(schema).toEqual(correctSpecifiedSchema);
      done();
    });
  });
});
