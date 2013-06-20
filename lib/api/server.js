var express = require('express'),
    pg = require('../store/pg'),
    app = express();

app.use('/', express.static(__dirname + '/../../www'));

app.get('/api/search', function (req, res) {
  // WARNING: this API pattern should be revisited and potentially rewritten as its probably bad!
  var zip = req.query.zip,
      last_name = req.query.last_name,
      where = '',
      params = [];
  if (zip) { 
    where += "provider_business_practice_location_address_postal_code=$1";
    params.push(zip);
  }

  if (last_name && zip) {
    where += " AND provider_last_name_legal_name=$2";
    params.push(last_name);
  }

  if (last_name && !zip) { 
    where += "provider_last_name_legal_name=$1";
    params.push(last_name);
  }

  if (where === '') {
    // TODO: return error
    res.json([]);
    return
  }

  pg.query("SELECT * FROM npis WHERE " + where, params, function (err, result) {
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
