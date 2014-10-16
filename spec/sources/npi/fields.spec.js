var npiFields = require('../../../lib/sources/npi/fields');

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

  it('should resolve a mapped/ non-mapped value to its db value', function () {
    var f = new npiFields([], metadata),
        r;

    r = f.unmappedValue('type', 'individual');
    expect(r).toEqual('1');

    r = f.unmappedValue('other_identifiers.type', 'medicare upin');
    expect(r).toEqual('02');

    r = f.unmappedValue('other_identifiers.type', 'hello');
    expect(r).toEqual(undefined);

    r = f.unmappedValue('first_name', 'hello');
    expect(r).toEqual('hello');

    r = f.unmappedValue('hello_word', 'hello');
    expect(r).toEqual(undefined);
  });

  it('should identify a key from a field', function () {
    var f = new npiFields([], metadata),
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
    var f = new npiFields([], metadata),
        idxs = f.indices();
    expect(idxs).toEqual({'test_index': 'entity_type_code'});
  });

  it('should transform a record', function () {
    var f = new npiFields([], metadata),
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

  it('should format field name', function () {
    // rules:
    //  all to lower case
    //  convert '(', ')', '.' and white space to '_'
    //  shorten multiple '_' in a row to single '_'
    //  trim _ from beginning and end
    var name = " Hello (World.U.S.) Something.)",
        result = npiFields.fieldName(name);

    expect(result).toEqual('hello_world_u_s_something');
    
    name = "Employer Identification Number (EIN)";
    result = npiFields.fieldName(name);
    expect(result).toEqual('employer_identification_number_ein');
  });

});
