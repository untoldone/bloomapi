var npiRemote = require('./npiRemote'),
    unzip = require('./unzip'),
    pdftohtml = require('./pdftohtml'),
    schema = require('./schema'),
    fs = require('fs'),
    pg = require('./pg'),
    stp = require('./schemaToPostgreSQL'),
		indices = require('./schemaIndices'),
		Q = require('q'),
    guessFields = require('./guessFields'),
    Inserter = require('./insert'),
    data_dir = './data';

function addFetch(promise) {
  var n = Q.when(promise, function () {
    var remote = new npiRemote();

    console.log('fetching full data dissemination...');
    return remote.fetchFull(data_dir);
  });

  return addUnzip(n);
}

function addUnzip(promise) {
  var n = Q.when(promise, function (path) {
    console.log('unzipping dissemination...');
    return unzip.unzip(path, data_dir);
  });

  return addProcess(n);
}

function addProcess(promise) {
  var headerFile,
      dataFile,
      n = Q.when(promise, function () {
    console.log('discovering dissemination schema...');
    return pdftohtml.convert(data_dir + "/NPPES  Data Dissemination - Readme.pdf");
  })
  .then(function () {
    return schema(data_dir + "/NPPES  Data Dissemination - Readme.txt");
  })
  .then(function (schema) {
    var deferred = Q.defer(),
        headerFileReg = /FileHeader\.csv$/,
        dataFileReg = /\d+\.csv$/;

    fs.readdir(data_dir, function (err, files) {
      if (err) {
        return deferred.reject(new Error(err));
      }
      
      files.forEach(function (file) {
        if (headerFileReg.exec(file)) {
          headerFile = file;
        } else if (dataFileReg.exec(file)) {
          dataFile = file;
        }
      });

      if (headerFile && dataFile) {
        deferred.resolve(schema);
      } else {
        deferred.reject(new Error('data file or header file not found'));
      }
      
    });

    return deferred.promise;
  }).then(function (schema) {
    return guessFields(schema, data_dir + "/" + headerFile);
  })
  .then(function (schema) {
    console.log('creating database table...');
		      var create = stp.importSchema(schema),
			      deferred = Q.defer(),
			      query = pg.query(create, function (err, result) {
				      if (err) {
					      deferred.reject(new Error(err));
				      }

				      deferred.resolve(result);
			      });
    return deferred.promise;
  })
  .then(function(){
    console.log('adding database indices...');
    indices_to_create = indices.generate_sql(['provider_business_practice_location_address_postal_code','provider_last_name_legal_name',['provider_business_practice_location_address_postal_code','provider_last_name_legal_name']]);
		      var deferred = Q.defer(),
			      query = pg.query(indices_to_create, function (err, result) {
				      if (err) {
					      deferred.reject(new Error(err));
				      }

				      deferred.resolve(result);
			      });
		return deferred.promise;
  })
  .then(function () {
    console.log('inserting dissemination data into database...');
    var inserter = new Inserter(data_dir + "/" + dataFile);
    return inserter.exec();
  }).then(function () {
    pg.end();
    console.log('completed data capture.');
  });

  return n;
}

module.exports = function (action) {
  var promise;

  if (action === undefined || action === 'fetch') {
    promise = addFetch();
  } else if (action === 'unzip') {
    promise = addUnzip(data_dir + '/NPPES_Data_Dissemination_June_2013.zip');
  } else if (action === 'process') {
    promise = addProcess();
  }

  console.log('starting data capture');
  return promise 
          .fail(function (err) {
            console.log(err.message); 
          });
};
