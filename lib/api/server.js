var express = require('express'),
    pg = require('../store/pg'),
		sql = require('sql'),
    app = express();

// define model for node-sql (https://github.com/brianc/node-sql)
var npiQueryableColumns = ['npi','provider_business_practice_location_address_postal_code','provider_last_name_legal_name']
var npi = sql.define({
	name: 'npis',
	columns: npiQueryableColumns
});


app.use('/', express.static(__dirname + '/../../www'));

app.get('/api/search', function (req, res) {
	var sqlQuery = npi.where(npi.npi.isNotNull()); // default scope

	// if req.query.limit is not specified, set to 1000
  var sqlLimit = ((req.query.limit === undefined) ? 100 : req.query.limit);
  sqlQuery = sqlQuery.limit(sqlLimit)

  // if req.query.offset is not specified, set to 0
  var sqlOffset = ((req.query.offset === undefined) ?  0 : req.query.offset);
  sqlQuery = sqlQuery.offset(sqlOffset)

  // loop through query parameters and add conditions to SQL query as appropriate
	for(var key in req.query) {
		value = req.query[key];

		if(npiQueryableColumns.indexOf(key) != -1 && value != '') {
			switch(key){
				case 'npi':
					sqlQuery = sqlQuery.where(npi.npi.equal(value));
					break;
				case 'provider_business_practice_location_address_postal_code':
					sqlQuery = sqlQuery.where(npi.provider_business_practice_location_address_postal_code.like(value+'%'))
					break;
				case 'provider_last_name_legal_name':
					sqlQuery = sqlQuery.where(npi.provider_last_name_legal_name.equal(value))
					break;
			}
	  } else {
			// do nothing with this query parameter, either:
			// - user is not allowed to query on the specified column
			// - the value of the parameter an empty string ('')
		}
	}

	sqlQuery = sqlQuery.toQuery()
	pg.query(sqlQuery.text, sqlQuery.values, function (err, result) {
    result.rows.forEach(function (row) {
      for(var k in row) {
        if (row[k] === null) delete row[k];
      }
    });
    res.json({
      meta: {
        rowCount: result.rowCount,
        sqlText: sqlQuery.text,
        sqlValues: sqlQuery.values,
        limit: sqlLimit,
        offset: sqlOffset
      },
      result:result.rows,
    });
  });
});

app.listen(3000);
console.log('Listening on port 3000');
