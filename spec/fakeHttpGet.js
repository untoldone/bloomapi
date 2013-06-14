module.exports = function (options, callback) {
  var obj = {},
      data,
      end,
      r;

  obj.on = function (evt, cb) {
    if (evt === 'data') {
      data = cb;
    } else if (evt === 'end') {
      end = cb;
    } else if (evt === 'response') {
      r = cb;
    }

    return obj;
  };

  callback(obj);
  setTimeout(function () {
    var content = module.exports.content,
        len = content.length,
        half = Math.floor(len / 2),
        part1 = content.slice(0,half),
        part2 = content.slice(half, len);
    r({
      headers: {
        'content-length': len
      }
    });
    data(part1);
    data(part2);
    end();
  }, 0);

  return obj;
};
