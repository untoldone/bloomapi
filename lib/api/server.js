var express = require('express'),
    pg = require('../store/pg'),
		sql = require('sql'),
    app = express(),
    nfLoader = require('../store/npiFieldLoader'),
    searchHelper = require('./search'),
    npiFields,
    npiQueryableColumns,
    npis,
    search;

// wait for resources to finish loading before starting server
nfLoader.load().then(function (nf) {
  npiFields = nf;
 
  search = new searchHelper(npiFields);
  npiQuerableColumns = npiFields.columns();
  npis = sql.define({
    name: 'npis',
    columns: npiQuerableColumns
  });

  app.listen(3000);
  console.log('Listening on port 3000');
});

app.use('/', express.static(__dirname + '/../../www'));

app.get('/api/search', function (req, res) {
  var sqlQuery = npis.where(npis.npi.isNotNull()), // default scope
      querySpec = search.parseQuery(req.query);

  sqlQuery = sqlQuery.offset(querySpec.offset).limit(querySpec.limit);


  // loop through query parameters and add conditions to SQL query as appropriate
  querySpec.search.forEach(function (searchSpec) {
    if (typeof searchSpec.key === 'object' && searchSpec.key.length === 1) {
      searchSpec.key = searchSpec.key[0];
    }

    // TODO: pay attention to 'searchSpec.op'
    if (typeof searchSpec.key === 'string') {
      sqlQuery = sqlQuery.and(npis[searchSpec.key].equals(searchSpec.value));
    } else {
      var orCondition;
      searchSpec.key.forEach(function (key) {
        if (orCondition) {
          orCondition = orCondition.or(npis[key].equals(searchSpec.value));
        } else {
          orCondition = npis[key].equals(searchSpec.value);
        }
      });

      sqlQuery = sqlQuery.and(orCondition);
    }
  });
	
	sqlQuery = sqlQuery.toQuery();
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
        limit: querySpec.limit,
        offset: querySpec.offset
      },
      result: npiFields.process(result.rows)
    });
  });
});

