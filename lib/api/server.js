var express = require('express'),
    path = require('path'),
    pg = require('../sources/pg'),
		sql = require('sql'),
    app = express(),
    nmLoader = require('../sources/npi/metaLoader'),
    searchHelper = require('./search'),
    Q = require('q'),
    NpiFields = require('../sources/npi/fields'),
    logger = require('../logger').server,
    data_sources = sql.define({
      name: 'data_sources',
      columns: ['source', 'updated', 'checked', 'status']
    }),
    port = 3000,
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

  app.listen(port);
  logger.info('listening on port ' + port);
}).fail(function (err) {
  logger.error(err.stack);
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
  var sqlQuery = npis;
  
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

app.get('/api/sources', function (req, res) {
  var sqlQuery = data_sources.select(data_sources.star()).toQuery();

  pg.query(sqlQuery.text, sqlQuery.values, function (err, r) {
    if (err) {
      logger.error(err.stack);
      return res.send(500, 'unknown error');
    }

    res.json({
      result: r.rows
    });
  });
});

app.get('/api/npis/:npi', function (req, res) {
  var npi = req.params['npi'],
      sqlQuery = npis;
  
  sqlQuery = sqlQuery.where(npis.npi.equals(npi)).limit(1);
  sqlQuery = sqlQuery.toQuery();
  
  pg.query(sqlQuery.text, sqlQuery.values, function (err, r) {
    if (err) {
      return res.send(404, "npi not found");
    }

    r.rows.forEach(function (row) {
      for(var k in row) {
        if (row[k] === null) delete row[k];
      }
    });

    if (r.rows.length === 0) {
      return res.send(404, "npi not found");
    }

    res.json({
      result: npiFields.process(r.rows)[0]
    }); 
  });
});

app.get('/api/search', function (req, res) {
  var querySpec = search.parseQuery(req.query),
      sqlQuery = buildQuery(querySpec),
      countQuery = buildQuery(querySpec);

  countQuery = countQuery.select("COUNT(*)");
  countQuery = countQuery.toQuery();
  sqlQuery = sqlQuery.offset(querySpec.offset).limit(querySpec.limit);
	sqlQuery = sqlQuery.toQuery();

  Q.all([
    Q.ninvoke(pg, 'query', countQuery.text, countQuery.values),
    Q.ninvoke(pg, 'query', sqlQuery.text, sqlQuery.values)
  ]).spread(function (countResult, queryResult) {
    var count = countResult.rows[0]['count'];
    
    queryResult.rows.forEach(function (row) {
      for(var k in row) {
        if (row[k] === null) delete row[k];
      }
    });

    res.json({
      meta: {
        rowCount: count,
      },
      result: npiFields.process(queryResult.rows)
    });
  }).fail(function (err) {
    if (err.code === '22P02') { // PostgreSQL error code: invalid input syntax for integer; Error while executing the query
      res.send(400, {
        name: 'TypeError',
        message: 'One or more key/value pairs are not of the correct type, e.g. a String in a field that is an Integer'
      });
    } else {
      logger.error(err.stack);
      res.send(500, 'Server Error');
    }
  });
});

app.use(function (err, req, res, next) {
  if (err.name == "ParameterError") {
    res.json(400, err);
  } else {
    logger.error(err.stack);
    res.send(500, 'Server Error');
  }
});
