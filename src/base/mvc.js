(function() {

  var config = require('./../config/config.json');

  exports.log = function() {
    if (config.DEBUG_LOG) return console.log((arguments.length === 1) ? arguments[0] : arguments);
  };

  exports.warn = function() {
    if (config.DEBUG_WARN) return console.log((arguments.length === 1) ? arguments[0] : arguments);
  };

  exports.error = function() {
    if (config.DEBUG_ERROR) return console.log((arguments.length === 1) ? arguments[0] : arguments);
  };

}).call(this);
