module.exports = function (path, options, callback) {
  setTimeout(function () {
    callback(null, module.exports.data);
  }, 0);
};
