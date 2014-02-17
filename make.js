require('shelljs/make');

var logger = require('./lib/logger');

// default target
target.all = function () {
  console.log("\nAvailable commands:\n-------------------");
  console.log(" node make bootstrap     # fetch, process, and insert NPI data into database")
  console.log(" node make fetch         # like 'bootstrap' but assumes you already have the base sql database setup")
  console.log(" node make server        # run web/API server")
  console.log(" node make check         # checks your environment for configuration files and some dependencies")
  console.log("\n For more information, visit the project README file on github at https://github.com/untoldone/bloomapi\n")
}

var Q = require('q');
Q.longStackSupport = true;

// calls npi#update
target.fetch = function () {
  var pg = require('./lib/sources/pg'),
      npi = require('./lib/sources/npi');

  logger.data.info('attempting to sync datasources');

  npi.update()
    .fail(function (e) {
      console.error("Error:\n" + e.stack); 
      process.exit(1);
    })
    .done(function () {
      pg.end(); 
    });
};

// creates the database and calls
// npi#update
target.bootstrap = function () {
  var pg = require('./lib/sources/pg'),
      npi = require('./lib/sources/npi'),
      fs = require('fs');

  logger.data.info('bootstrapping bloomapi');

  target.docs();

  Q.nfcall(fs.readFile, './lib/bootstrap.sql', {encoding: 'utf8'})
    .then(function (data) {
      return Q.ninvoke(pg, 'query', data);
    })
    .fail(function (e) {
      if(e.code == '42710'){ // "DUPLICATE OBJECT" according to http://www.postgresql.org/docs/9.0/static/errcodes-appendix.html
        logger.data.info("looks like you already have the database schema set up. (bootstrap assumes you don't.)")
        logger.data.info("if you need to update the NPI data, simply run `node make fetch`")
      } else {
        console.error("Error:\n", e.stack);
        process.exit(1);
      }
    })
    .then(npi.update)
    .fail(function (e) {
      console.error("Error:\n", e.stack);
      process.exit(1);
    })
    .done(function () {
      pg.end(); 
    });
}

target.server = function () {
  logger.server.info('starting bloomapi');
  require('./lib/api/server');
};

target.docs = function () {
  logger.data.info('building website');
  var docs = require('./lib/docs');
  docs.build().done();
};

target.check = function () {
  if (!test('-f', './config.js')) {
    console.log('ERROR: no configuration file found, copy and configure ./config.js.sample to ./config.js');
  }

  var valid = true,
      pg = require('./lib/sources/pg'),
      query = pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", function (err, result) {
    if (err) {
      console.log('ERROR: running query on database, check credentials');
      valid = false;
    }

    if (!which('7z')) {
      console.log('ERROR: p7zip is required for bootstrap task');
      valid = false;
    }

    if (!which('pdftotext')) {
      console.log('ERROR: pdftotext is required for bootstrap task');
      valid = false;
    }

    if (valid) {
      console.log('PASSED: all checks');
    }
  });

  query.on('end', function () {
    pg.end();
  });

};

// inserts a record in the geocodes table,
// if the record doesn't exist.
target.geocode = function() {
  logger.data.info('geocoding providers');

  var pg = require('./lib/sources/pg'),
      geocoderProvider = 'mapquest',
      httpAdapter = 'http',
      extra = {apiKey: process.env.API_KEY},
      geocoder = require('node-geocoder').getGeocoder(geocoderProvider, httpAdapter, extra),
      query = pg.query('SELECT npi,provider_first_line_business_practice_location_address,' + 
              'provider_business_practice_location_address_city_name,' +
              'provider_business_practice_location_address_state_name,' +
              'provider_business_practice_location_address_postal_code FROM npis limit 1');

  Q.ninvoke(query, 'on', 'row', function (row, result) {
    var address = row.provider_first_line_business_practice_location_address + ', ' + 
                row.provider_business_practice_location_address_city_name + ', ' +
                row.provider_business_practice_location_address_state_name +
                row.provider_business_practice_location_address_postal_code;

    logger.data.info("Processing practice location for #" + row.npi);
    logger.data.info("Geocoding: " + address);

    geocoder.geocode(address, function(err, res) {
      if (res && res[0]) {
        var geo = res[0];
        logger.data.info("Latitude: " + geo.latitude);
        logger.data.info("Longitud: " + geo.longitude);
        logger.data.info("Geocoded!");

        pg.query("SELECT npi from provider_business_practice_locations where npi = $1", [row.npi], function(err, result) {
          if (result.rows[0]) {
            var update_query = pg.query("UPDATE provider_business_practice_locations SET latitude = $1, longitude = $2 WHERE npi = $3",
                                          [geo.latitude, geo.longitude, row.npi]);
            update_query.on('end', function () {
              logger.data.info('Updated location');
            });

          } else {
            var insert_query = pg.query("INSERT INTO provider_business_practice_locations(npi, latitude, longitude) VALUES($1, $2, $3) RETURNING npi",
                                          [row.npi, geo.latitude, geo.longitude]);
            insert_query.on('end', function () {
              logger.data.info('Inserted new location');
            });  
          }
        });

      } else {
        logger.data.info("Failed to geocode: " + address);
        logger.data.info(err);
      }
    });
  }).done(function() {
    pg.end();
  });

}
