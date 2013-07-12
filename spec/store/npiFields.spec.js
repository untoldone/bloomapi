var npiFields = require('../../lib/store/npiFields');

describe('NPIFields', function () {
  var metadata = {
    'healthcare_provider_taxonomy_code_{1-15}': {
      'key': 'provider_details',
      'rename': 'healthcare_taxonomy_code'
    },
    'other_provider_identifier_type_code_{1-2}': {
      'key': 'other_identifiers',
      'rename': 'type',
      'map': {
        '02': 'medicare upin'
      }
    },
    'something_something': {
      'key': 'something',
      'rename': 'specific'
    },
    'entity_type_code': {
      'rename': 'type',
      'index': 'test_index',
      'map': {
        1: 'individual'
      }
    },
    'provider_first_name': {
      'rename': 'first_name'
    }
  };

  it('should identify a key from a field', function () {
    var f = new npiFields(metadata),
        r;

    r = f.nameToInfo('first_name');
    expect(r).toEqual('provider_first_name');

    r = f.nameToInfo('something.specific')
    expect(r).toEqual('something_something');

    r = f.nameToInfo('non.existent');
    expect(r).toEqual(undefined);

    r = f.nameToInfo('other_identifiers.type');
    expect(r).toEqual(['other_provider_identifier_type_code_1', 'other_provider_identifier_type_code_2']);
  });

  it('should return all indices', function () {
    var f = new npiFields(metadata),
        idxs = f.indices();
    expect(idxs).toEqual({'test_index': 'entity_type_code'});
  });

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
