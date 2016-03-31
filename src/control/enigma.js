(function() {

  var EventProxy = require('eventproxy');

  var view = require("./../common/view"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    proxy = require("./../proxy");


  exports.index = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.board.index;

    data.err = 0;
    
    callback(true);

  };

}).call(this);
