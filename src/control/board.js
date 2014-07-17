
(function() {

  var EventProxy = require('eventproxy');

  var view = require("./../common/view"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    proxy = require("./../proxy"),
    BoardProxy = proxy.Board,
    TopicProxy = proxy.Topic;

  var Topic = require("./../class/topic").Topic;

  /*BoardProxy.newAndSave('news', '新闻', 0, 0, '', null, function (err, b) {
    console.log(err, b);
  });*/

  /*function initData(res, data, subtitle) {
    if (subtitle) {
      data.title = subtitle + ' - ' + res.locals.core.lang.title.bbs.index;
    } else {
      data.title = res.locals.core.lang.title.bbs.index;
    }
  }*/

  exports.index = function(req, res, data, callback) {

    //initData(res, data);

    if (req.params.shortcut) {
      data.active = 'board/' + req.params.shortcut;

      var topic = new Topic(req.params.shortcut);
      topic.index(req, res, data, callback);
    } else {
      //TODO: index, show all boards
      data.active = 'board';
      callback();
    }

  };

  exports.add = function(req, res, data, callback) {
    //initData(res, data, res.locals.core.lang.topic.add);
    if (req.params.shortcut) {
      data.active = 'board/' + req.params.shortcut;

      var topic = new Topic(req.params.shortcut);
      topic.add(req, res, data, callback);
    } else {
      res.redirect('/board');
      callback(true);
    }
  };

}).call(this);