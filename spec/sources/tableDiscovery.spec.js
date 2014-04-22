var fs = require('fs'),
    TableDiscovery = require('../../lib/sources/tableDiscovery'),
    Sequelize = require('sequelize'),
    split = require('split'),
    through = require('through'),
    csv = require('csvrow');

describe('sources/tableDiscovery', function () {
  var discoverableSchema = {
    tone: {
      id: {
        composite: [
          'shmo'
        ]
      },
      joe: '/shmo/'
    }
  };

  var nonDiscoverableSchema = {
    ttwo: {
      id: {
        composite: [
          'shmo'
        ]
      },
      joe: {
        named: 'joe',
        type: 'string/60'
      }
    }
  };

  var emptySchema = { tone: null };

  var correctSchema = {
    tone: {
      id: {
        composite: [ "shmo" ]
      },
      joe: {
        named: /shmo/,
        type: "string"
      }
    }
  };

  var correctEmptySchema = {
    tone: {
      shmo: {
        named: "shmo",
        type: "string"
      }
    }
  }
  
  var correctSpecifiedSchema = {
    ttwo: {
      id: {
        composite: [ "shmo" ]
      },
      joe: {
        named: "joe",
        type: "string/60"
      }
    }
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
    
    tableDiscovery = new TableDiscovery(emptySchema, hintPipe);
    expect(tableDiscovery.requiresHint()).toEqual(true);
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

  it('should discover the whole table of a unspecified one', function (done) {
    var tableDiscovery, hintPipe;
    
    hintPipe = fs.createReadStream(__dirname + "/../fixtures/discoveryHint.csv")
      .pipe(split())
      .pipe(through(function (data) {
        this.queue(csv.parse(data)); 
      }));
    
    tableDiscovery = new TableDiscovery(emptySchema, hintPipe),
   
    tableDiscovery.schema(function (err, schema) {
      expect(schema).toEqual(correctEmptySchema);
      done();
    });
  });
});
