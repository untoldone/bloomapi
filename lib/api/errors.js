var errors = module.exports = {};

// ParameterError
errors.ParameterError = function (message, parameters) {
  this.name = "ParameterError";
  this.message = message || "Error with parameters";
  this.parameters = parameters || {};
}

errors.ParameterError.prototype = Error.prototype;
errors.ParameterError.constructor = error.ParameterError;
