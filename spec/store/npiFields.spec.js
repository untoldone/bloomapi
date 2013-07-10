var npiFields = require('../../lib/store/npiFields');

describe('NPIFields', function () {
  it('should transform a record', function (done) {
    npiFields.process([{
      'healthcare_provider_taxonomy_code_2': 'hello',
      'other_provider_identifier_type_code_2': '02',
      'entity_type_code': 1,
      'provider_first_name': 'George'
    }]).then(function (results) {
      expect(results).toEqual([{
        'provider_details': [{}, {
          'healthcare_taxonomy_code': 'hello'
        }],
        'other_identifiers': [
          {},
          {
            'type': 'medicare upin'
          }
        ],
        'type': 'individual',
        'first_name': 'George'
      }]);
    }, function (err) {
      expect(err.message).toEqual(undefined); 
    }).done(function () { done(); });;
  });
});
