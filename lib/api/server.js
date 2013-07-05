var express = require('express'),
    pg = require('../store/pg'),
		sql = require('sql'),
    app = express();

// define model for node-sql (https://github.com/brianc/node-sql)
var npi_queryable_columns = ['npi','provider_business_practice_location_address_postal_code','provider_last_name_legal_name']
var npi = sql.define({
	name: 'npis',
	columns: npi_queryable_columns
});


app.use('/', express.static(__dirname + '/../../www'));

app.get('/api/search', function (req, res) {
	var sql_query = npi.where(npi.npi.isNotNull()); // default scope

	// set defaults if certain parameters are not passed in
	if(!req.query.limit){
		sql_query = sql_query.limit(1000);
	}
	if(!req.query.offset){
		sql_query = sql_query.offset(0);
	}

	for(var key in req.query) {
		value = req.query[key];

		if(npi_queryable_columns.indexOf(key) != -1 && value != '') {
			switch(key){
				case 'npi':
					sql_query = sql_query.where(npi.npi.equal(value));
					break;
				case 'provider_business_practice_location_address_postal_code':
					sql_query = sql_query.where(npi.provider_business_practice_location_address_postal_code.like(value+'%'))
					break;
				case 'provider_last_name_legal_name':
					sql_query = sql_query.where(npi.provider_last_name_legal_name.equal(value))
					break;
			}
	  } else {
			// do nothing with this query parameter, either:
			// - user is not allowed to query on the specified column
			// - the value of the parameter an empty string ('')
		}
	}

	sql_query = sql_query.toQuery()
	pg.query(sql_query.text, sql_query.values, function (err, result) {
    result.rows.forEach(function (row) {
      for(var k in row) {
        if (row[k] === null) delete row[k];
      }
    });
    res.json(result.rows);
  });
});

app.listen(3000);
console.log('Listening on port 3000');
