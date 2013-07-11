var npiFields = require('../../lib/store/npiFields');

describe('NPIFields', function () {
  var metadata = {
    'healthcare_provider_taxonomy_code_{1-15}': {
      'key': 'provider_details',
      'rename': 'healthcare_taxonomy_code'
    },
    'other_provider_identifier_type_code_{1-15}': {
      'key': 'other_identifiers',
      'rename': 'type',
      'map': {
        '02': 'medicare upin'
      }
    },
    'entity_type_code': {
      'rename': 'type',
      'map': {
        1: 'individual'
      }
    },
    'provider_first_name': {
      'rename': 'first_name'
    }
  };

  it('should transform a record', function () {
    var f = new npiFields(metadata),
        results = f.process([{
          'healthcare_provider_taxonomy_code_2': 'hello',
          'other_provider_identifier_type_code_2': '02',
          'entity_type_code': 1,
          'provider_first_name': 'George'
        }]);

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
  });
});
