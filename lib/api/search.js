var ParamError = require('./errors').ParameterError,
    keyReg = /^key(\d+)$/,
    valueReg = /^value(\d+)$/,
    opReg = /^op(\d+)$/,
    optionalParams = ['limit', 'offset'],
    validOps = ['eq'];

function strictParseInt(value) {
  if(/^\-?([0-9]+|Infinity)$/.test(value)) return Number(value);
  return NaN;
}

var searchHelper = module.exports = function (npiFields) {
  this.npiFields = npiFields;
};

searchHelper.prototype = {
  buildTerms: function (query) {
    var unknownParams = [],
        paramSets = {},
        paramResults = [],
        limit = 100,
        offset = 0,
        match, key;

    if (Object.keys(query).length === 0) {
      throw new ParamError('search requires at least one set of search parameters (e.g. key1/op1/value1)');
    }

    for (key in query) {
      if (optionalParams.indexOf(key) !== -1) {
        var i = strictParseInt(query[key]);
        if (isNaN(i)) {
          var details = {};
          details[key] = 'is not a number';
          throw new ParamError(key + " must be a number", details);
        }

        if (i < 0) {
          var details = {};
          details[key] = 'is less than zero';
          throw new ParamError(key + " must be greater than zero", details);
        }

        if (key === 'limit' && i > 100) {
          throw new ParamError("limit must be less than zero", {"limit": "is greater than 100"});
        }

        if (key === 'limit') {
          limit = i;
        }

        if (key === 'offset') {
          offset = i;
        }
      } else if (match = keyReg.exec(key)) {
        var paramSet = paramSets[match[1]] || (paramSets[match[1]] = {});
        paramSet.key = query[key];
      } else if (match = valueReg.exec(key)) {
        var paramSet = paramSets[match[1]] || (paramSets[match[1]] = {});
        paramSet.value = query[key];
      } else if (match = opReg.exec(key)) {
        var paramSet = paramSets[match[1]] || (paramSets[match[1]] = {});
        paramSet.op = query[key];
      } else {
        unknownParams.push(key);
      }
    }

    if (unknownParams.length > 0) {
      var message = unknownParams.join(', ') + " are unknown parameters",
          params = {};

      unknownParams.forEach(function (param) {
        params[param] = "is an unknown parameter";
      });

      throw new ParamError(message, params);
    }

    for (key in paramSets) {
      var paramSet = paramSets[key];
      if (!paramSet.key) {
        throw new ParamError('one or more key/op/value sets are missing a key');
      }
      
      if (!paramSet.op) {
        throw new ParamError('one or more key/op/value sets are missing an op');
      }

      if (!paramSet.value) {
        throw new ParamError('one or more key/op/value sets are missing a value');
      }

      paramResults.push(paramSet);
    }

    return {
      limit: limit,
      offset: offset,
      search: paramResults
    };
  },
  convertToColumns: function (terms) {
    // replace each search param with a column or list of columns, throw on unknown col
    var columns = [],
        that = this;

    terms.forEach(function (term) {
      var column = that.npiFields.nameToInfo(term.key),
          unvalue = that.npiFields.unmappedValue(term.key, term.value);
      if (column) {
        columns.push({
          key: column,
          op: term.op,
          value: unvalue
        });
      } else {
        var details = {};
        details[term.key] = 'is an unknown field';
        throw new ParamError('unknown field', details);
      }
    });

    return columns;
  },
  assertValidTerms: function (terms) {
    // ensure at least one term is indexed, ensure all ops are understood
    var indices = this.npiFields.indices(),
        foundIndex = false;

    indices = Object.keys(indices).map(function (key) { return indices[key]; });

    indices.push('npi');

    terms.forEach(function (term) {
      if (indices.indexOf(term.key) != -1) foundIndex = true;

      if (validOps.indexOf(term.op) == -1) {
        throw new ParamError("invalid operation '" + term.op + "'");
      }
    });

    if (!foundIndex) throw new ParamError('must include at least one indexed search term');
  },
  parseQuery: function (query) {
    var terms = this.buildTerms(query),
        termsWCols = this.convertToColumns(terms.search);

    this.assertValidTerms(termsWCols);

    terms.search = termsWCols;

    return terms;
  }
}
