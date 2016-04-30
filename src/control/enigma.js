(function() {

  var EventProxy = require('eventproxy');
  var _ = require('underscore');
  var gm = require('gm').subClass({ imageMagick : true });
  var at = require("./../services/at");
  var markdown = require('../common/markdown').Markdown;

  //table = require("./../base/table");
  var config = require('./../config/config.json');
  var functions = require("./../common/functions"),
    string = require("./../common/string"),
    constdata = require("./../common/constdata"),
    proxy = require("./../proxy"),
    UserAccountProxy = proxy.UserAccount,
    UserPageProxy = proxy.UserPage;


  exports.index = function(req, res, data, callback) {

    data.err = 0;
    
    callback(true);

  };

  exports.auth = function(req, res, data, callback) {
    req.body.user;
    req.body.password;
    callback(true);
  }

}).call(this);
