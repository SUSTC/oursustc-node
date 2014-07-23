(function() {

  var EventProxy = require('eventproxy');

  var view = require("./../common/view"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    proxy = require("./../proxy"),
    BoardProxy = proxy.Board,
    TopicProxy = proxy.Topic;

  var Topic = require("./../class/topic").Topic;

  /* BoardProxy.newAndSave('bla', 'baba', 0, 0, '', '53c908582ccde07c15000022', function (err, b) {
    console.log(err, b);
  }); */

  exports.index = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.board.index;

    if (req.params.shortcut) {
      data.active = 'board/' + req.params.shortcut;

      var topic = new Topic(req.params.shortcut);
      topic.getboardstree(function (err, boards) {
        data.showtopics = true;
        data.boards = boards;
        topic.index(req, res, data, callback);
      });
    } else {
      var topic = new Topic();
      topic.getboardstree(function (err, boards) {
        data.showboards = true;
        data.active = 'board';
        data.boards = boards;
        callback();
      });
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
