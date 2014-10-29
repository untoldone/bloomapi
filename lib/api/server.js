var cluster = require('cluster'),
    numCpus = require('os').cpus().length,
    express = require('express'),
    path = require('path'),
    settings = require('../settings'),
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
    search,
    pg;

app.locals.ga_tracking_id = settings['googleAnalytics']['trackingID'];
app.locals.ga_domain = settings['googleAnalytics']['domain'];

// wait for resources to finish loading before starting server
Q.spread([
  nmLoader.loadSchema(),
  nmLoader.loadFields(),
  nmLoader.loadDocModel()
], function (schema, nfields, docModel) {
  npiFields = new NpiFields(schema, nfields);
  
  search = new searchHelper(npiFields);
  npiQuerableColumns = npiFields.columns();
  npis = sql.define({
    name: 'npis',
    columns: npiQuerableColumns
  });

  app.get('/documentation', function (req, res) {
    res.render('documentation.jade', {docModel: docModel});
  });

  app.use(function(req, res, next){
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
      res.render('404.jade');
      return;
    }

    res.type('txt').send('Not found');
  });

  if (cluster.isMaster) {
    var i;

    logger.info('starting bloomapi');
    logger.info("Master launching " + numCpus + " workers");

    for (i = 0; i < numCpus; i++) {
      cluster.fork();
    }
  } else {
    pg = require('../sources/pg');
    var workerPort = port - 1 + parseInt(cluster.worker.id);
    app.listen(workerPort);
    logger.info("Worker " + cluster.worker.id + " listening on " + workerPort);
  }
}).fail(function (err) {
  logger.error(err.stack);
  exit(1);
});

app.get('/search', function (req, res) {
  res.render('search.jade');
});

app.get('/contribute', function (req, res) {
  res.render('contribute.jade');
});

app.get('/', function (req, res) {
  res.render('index.jade');
});

app.get(/\/search\/([^\/]+)(\/([1-9]\d*))?/, function (req, res) {
  var term = req.params[0],
      page = req.params[2] ? parseInt(req.params[2]) : 1,
      root = "http://www.bloomapi.com/api/search?",
      params = discoverAPI(term, page),
      uri;
  
  if (!params) {
    res.render('search-results.jade', {term: term});
    return;
  }

  uri = root + params.uri;
  delete params.uri;

  execSearch(params, function (err, data) {
    if (err) {
      logger.error(err.stack);
      return res.send(500, 'Server Error');
    }
    
    res.render('search-results.jade', {
      entries: data.result,
      apiuri: uri,
      term: term,
      currentPage: page,
      pages: pages(page, Math.ceil(data.meta.rowCount / 10))
    });
  });
});

app.get('/npis/:npi', function (req, res) {
  var npi = req.params['npi'],
      uri = 'http://www.bloomapi.com/api/npis/' + npi,
      retTerm = req.query['retTerm'],
      retPage = req.query['retPage'] || 1;

  execFind(npi, function (err, data) {
    if (err) {
      res.status(404);
      return res.render('404.jade');
    }

    res.render('search-result.jade', {result: data.result, apiuri: uri, retTerm: retTerm, retPage: retPage});
  });
});

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
  var npi = req.params['npi'];

  execFind(npi, function (err, result) {
    if (err) return res.send(404, "npi not found");
    res.json(result);
  });
});

app.get('/api/search', function (req, res) {
  var params = req.query;

  execSearch(params, function (err, result) {
    if (err) {
      if (err.code === '22P02') { // PostgreSQL error code: invalid input syntax for integer; Error while executing the query
        res.send(400, {
          name: 'TypeError',
          message: 'One or more key/value pairs are not of the correct type, e.g. a String in a field that is an Integer'
        });
      } else {
        logger.error(err.stack);
        res.send(500, 'Server Error');
      }
    }

    res.json(result);
  });
});

app.get('/sitemap.xml', function (req, res) {
  var countQuery,
      lastModQuery;

  res.header('Content-Type', 'application/xml');

  countQuery = npis.select('COUNT(*)').toQuery();
  lastModQuery = data_sources.select(data_sources.star()).toQuery();

  Q.spread([
      Q.ninvoke(pg, 'query', countQuery.text, countQuery.values),
      Q.ninvoke(pg, 'query', lastModQuery.text, lastModQuery.values)
    ], function (count, lastMod) {
      var modDate = lastMod.rows[0].updated;
      var options = {
        count: Math.ceil(count.rows[0].count / 50000),
        lastMod: modDate.getUTCFullYear() + "-" + ("0" + (modDate.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + modDate.getUTCDate()).slice(-2)
      };

      res.render('sitemap-index.jade', options);
    })
    .fail(function (e) {
      logger.error(e.stack);
      res.send(500, 'Server Error');
    });
});

app.get(/^\/sitemaps\/(\d+).xml$/, function (req, res) {
  var page, sqlQuery;
  
  page = parseInt(req.params[0]);
  
  res.header('Content-Type', 'application/xml');

  sqlQuery = npis.select(npis.npi, npis.last_update_date, npis.npi_deactivation_date).offset(page * 50000).limit(50000).toQuery();

  Q.ninvoke(pg, 'query', sqlQuery.text, sqlQuery.values)
    .fail(function (e) {
      logger.error(e.stack);
      res.send(500, 'Server Error');
    })
    .done(function (result) {
      var npis = result.rows.map(function (elm) {
        var date = elm.last_update_date || elm.npi_deactivation_date;
        date = date.getUTCFullYear() + "-" + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getUTCDate()).slice(-2);
        return {
          npi: elm.npi,
          updated: date
        }
      });
      res.render('sitemap.jade', { npis: npis });
    });
});

app.use(express.static(__dirname + '/../../public'));

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

app.use(function (err, req, res, next) {
  if (err.name == "ParameterError") {
    res.json(400, err);
  } else {
    logger.error(err.stack);
    res.send(500, 'Server Error');
  }
});

function execFind(npi, callback) {
  var sqlQuery = npis;
  
  sqlQuery = sqlQuery.where(npis.npi.equals(npi)).limit(1);
  sqlQuery = sqlQuery.toQuery();
  
  pg.query(sqlQuery.text, sqlQuery.values, function (err, r) {
    if (err) {
      return callback(new Error("npi not found"));
    }

    r.rows.forEach(function (row) {
      for(var k in row) {
        if (row[k] === null) delete row[k];
      }
    });

    if (r.rows.length === 0) {
      return callback(new Error("npi not found"));
    }

    callback(null, {
      result: npiFields.process(r.rows)[0]
    });
  });
}

function execSearch(params, callback) {
  var querySpec = search.parseQuery(params),
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

    callback(null, {
      meta: {
        rowCount: count,
      },
      result: npiFields.process(queryResult.rows)
    });
  }).fail(function (err) {
    callback(err);
  });
}

function pages(currentPage, pageCount) {
  var i = 1,
      result = [],
      cur;

  if (pageCount < 8) {
    // non-dotted
    for (; i <= pageCount; i++) {
      result.push(i);
    }
  } else if (currentPage < 3) {
    // dotted-right
    result = [1,2,3,4, '...', pageCount];
  } else if (pageCount - currentPage < 3) {
    // dotted-left
    result = [1, '...', pageCount - 3,  pageCount - 2, pageCount - 1, pageCount];
  } else {
    // dotted-both
    result = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', pageCount];
  }

  return result;
}

function discoverAPI(term, page) {
  var skip = (page - 1) * 10,
      params, match;

  term = term.trim();

  if (/^\d{10}$/.exec(term)) {
    // npi
    params = {
      uri: "limit=10&offset=" + skip + "&key1=npi&op1=eq&value1=" + term,
      limit: 10,
      offset: skip,
      key1: 'npi',
      op1: 'eq',
      value1: term
    };
  } else if (/^(\d{5}|\d{9})$/.exec(term)) {
    // zipcode
    params = {
      uri: "limit=10&offset=" + skip + "&key1=practice_address.zip&op1=eq&value1=" + term,
      limit: 10,
      offset: skip,
      key1: 'practice_address.zip',
      op1: 'eq',
      value1: term
    };
  } else if (/^([a-zA-Z]+)$/.exec(term)) {
    // lastname
    params = {
      uri: "limit=10&offset=" + skip + "&key1=last_name&op1=eq&value1=" + term.toUpperCase(),
      limit: 10,
      offset: skip,
      key1: 'last_name',
      op1: 'eq',
      value1: term.toUpperCase()
    };
  } else if (match = /^([a-zA-Z]+)((\s+[a-zA-Z]+)+)$/.exec(term)) {
    // first and last name
    params = {
      uri: "limit=10&offset=" + skip + "&key1=last_name&op1=eq&value1=" + match[2].trim().toUpperCase() + 
           "&key2=first_name&op2=eq&value2=" + match[1].trim().toUpperCase(),
      limit: 10,
      offset: skip,
      key1: 'last_name',
      op1: 'eq',
      value1: match[2].trim().toUpperCase(),
      key2: 'first_name',
      op2: 'eq',
      value2: match[1].trim().toUpperCase()
    };
  } else if (match = /^([\d\w\s]+),\s*([\w\s]+),\s*(\w+)\s*(\d+)$/.exec(term)) {
    // address
    var address_line = match[1].trim().toUpperCase(),
        city = match[2].trim().toUpperCase(),
        state = match[3].trim().toUpperCase(),
        zip = match[4].trim().toUpperCase();
    params = {
      uri: "limit=10&offset=" + skip + 
           "&key1=practice_address.address_line&op1=eq&value1=" + address_line +
           "&key2=practice_address.city&op2=eq&value2=" + city +
           "&key3=practice_address.state&op3=eq&value3=" + state +
           "&key4=practice_address.zip&op4=eq&value4=" + zip,
      limit: 10,
      offset: skip,
      key1: 'practice_address.address_line',
      key2: 'practice_address.city',
      key3: 'practice_address.state',
      key4: 'practice_address.zip',
      op1: 'eq',
      op2: 'eq',
      op3: 'eq',
      op4: 'eq',
      value1: address_line,
      value2: city,
      value3: state,
      value4: zip
    };
  } else {
    return null;
  }

  return params;
}
