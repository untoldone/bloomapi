var express = require('express'),
    path = require('path'),
    pg = require('../store/pg'),
		sql = require('sql'),
    app = express(),
    nmLoader = require('../store/npiMetaLoader'),
    searchHelper = require('./search'),
    Q = require('q'),
    NpiFields = require('../store/npiFields'),
    npiFields,
    npiQueryableColumns,
    npis,
    search;

// wait for resources to finish loading before starting server
Q.spread([
  nmLoader.loadSchema(),
  nmLoader.loadFields()
], function (schema, nfields) {
  npiFields = new NpiFields(schema, nfields);
  
  search = new searchHelper(npiFields);
  npiQuerableColumns = npiFields.columns();
  npis = sql.define({
    name: 'npis',
    columns: npiQuerableColumns
  });

  app.listen(3000);
  console.log('Listening on port 3000');
}).fail(function (err) {
  console.log(err.stack);
  exit(1);
});

app.get('/search', function (req, res) {
  var p = path.resolve(__dirname + '/../../www/search.html');
  res.sendfile(p);
});

app.get('/documentation', function (req, res) {
  var p = path.resolve(__dirname + '/../../www/documentation.html');
  res.sendfile(p);
});

app.get('/contribute', function (req, res) {
  var p = path.resolve(__dirname + '/../../www/contribute.html');
  res.sendfile(p);
});

app.use('/', express.static(__dirname + '/../../www'));

function buildQuery(querySpec) {
  var sqlQuery = npis.where(npis.npi.isNotNull()); // default scope
  
  // loop through query parameters and add conditions to SQL query as appropriate
  querySpec.search.forEach(function (searchSpec) {
    var opFunc;

    if (typeof searchSpec.key === 'object' && searchSpec.key.length === 1) {
      searchSpec.key = searchSpec.key[0];
    }

    switch (searchSpec.op) {
      case 'eq':
        opFunc = 'equals'
        break;
    }

    if (typeof searchSpec.key === 'string') {
      sqlQuery = sqlQuery.and(npis[searchSpec.key][opFunc](searchSpec.value));
    } else {
      var orCondition;
      searchSpec.key.forEach(function (key) {
        if (orCondition) {
          orCondition = orCondition.or(npis[key][opFunc](searchSpec.value));
        } else {
          orCondition = npis[key].equals(searchSpec.value);
        }
      });

      sqlQuery = sqlQuery.and(orCondition);
    }
  });

  return sqlQuery;
}

app.get('/api/search', function (req, res) {
  var querySpec = search.parseQuery(req.query),
      sqlQuery = buildQuery(querySpec),
      countQuery = buildQuery(querySpec);

  countQuery = countQuery.select(npis.count());
  countQuery = countQuery.toQuery();
  sqlQuery = sqlQuery.offset(querySpec.offset).limit(querySpec.limit);
	sqlQuery = sqlQuery.toQuery();

  var result, count;
  function respond() {
    res.json({
      meta: {
        rowCount: count,
        sqlText: sqlQuery.text,
        sqlValues: sqlQuery.values,
        limit: querySpec.limit,
        offset: querySpec.offset
      },
      result: npiFields.process(result.rows)
    });
  }

  pg.query(countQuery.text, countQuery.values, function (err, r) {
    count = r.rows[0]['npis_count'];

    if (result && count) respond();
  });

	pg.query(sqlQuery.text, sqlQuery.values, function (err, r) {
    r.rows.forEach(function (row) {
      for(var k in row) {
        if (row[k] === null) delete row[k];
      }
    });

    result = r; 
    
    if (result && count) respond();
  });
});

