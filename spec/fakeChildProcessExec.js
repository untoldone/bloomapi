module.exports = function (command) {
  var obj = {},
      e;

  obj.on = function (evt, cb) {
    if (evt === 'exit') {
      e = cb;    
    }

    return obj;
  };

  setTimeout(function () {
    if(command === module.exports.command) {
      e(0); 
    } else {
      e(1);
    };
  }, 0);

  return obj;
};
