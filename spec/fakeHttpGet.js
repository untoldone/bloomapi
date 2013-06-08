module.exports = function (options, callback) {
  var obj = {},
      data,
      end;

  obj.on = function (evt, cb) {
    if (evt === 'data') {
      data = cb;
    } else if (evt === 'end') {
      end = cb;
    }
  };

  callback(obj);
  data(module.exports.content);
  end();

  return obj;
};
