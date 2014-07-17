
(function() {

  var EventProxy = require('eventproxy');

  var view = require("./../common/view"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    proxy = require("./../proxy"),
    BoardProxy = proxy.Board,
    TopicProxy = proxy.Topic;

  var Topic = require("./../class/topic").Topic;

  /*function initData(res, data, subtitle) {
    if (subtitle) {
      data.title = subtitle + ' - ' + res.locals.core.lang.title.bbs.index;
    } else {
      data.title = res.locals.core.lang.title.bbs.index;
    }
    data.active = 'bbs';
  }*/

  exports.index = function(req, res, data, callback) {

    //initData(res, data);

    if (req.params.shortcut) {

      var topic = new Topic(req.params.shortcut);
      topic.index(req, res, data, callback);

    } else {
      //TODO: index, show all boards
      callback();
    }

  };

}).call(this);