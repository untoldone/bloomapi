var express = require('express'),
    pg = require('../store/pg'),
    app = express();

app.use('/', express.static(__dirname + '/../../www'));

app.get('/api/search', function (req, res) {
  // WARNING: this API pattern should be revisited and potentially rewritten as its probably bad!
  var zip = req.query.zip,
      last_name = req.query.last_name,
      where = '';
  if (zip) where += "provider_business_practice_location_address_postal_code = '" + zip + "' ";
  if (last_name && zip) where += "AND provider_last_name_legal_name = '" + last_name + "' ";
  if (last_name && !zip) where += "provider_last_name_legal_name = '" + last_name + "' ";
  if (where === '') {
    // TODO: return error
  }

  pg.query("SELECT * FROM npis WHERE " + where, function (err, result) {
    res.json(result.rows);
  });
});

app.listen(3000);
console.log('Listening on port 3000');
