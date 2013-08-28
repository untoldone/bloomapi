var schema = require('../../../../lib/sources/npi/monthly/schema');

describe('npi monthly schema', function () { 
  it('should format field name', function () {
    // rules:
    //  all to lower case
    //  convert '(', ')', '.' and white space to '_'
    //  shorten multiple '_' in a row to single '_'
    //  trim _ from beginning and end
    var name = " Hello (World.U.S.) Something.)",
        result = schema.fieldName(name);

    expect(result).toEqual('hello_world_u_s_something');
    
    name = "Employer Identification Number (EIN)";
    result = schema.fieldName(name);
    expect(result).toEqual('employer_identification_number_ein');
  });
});
