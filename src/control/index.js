
(function() {

  var EventProxy = require('eventproxy');

  var proxy = require("./../proxy"),
    BoardProxy = proxy.Board;
    TopicProxy = proxy.Topic;

  var NEWS_board_id = false;

  exports.index = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.index;
    data.active = 'index';

    var events = ['latest_topics'];
    var ep = EventProxy.create(events, function (latest_topics) {
      data.latest_topics = latest_topics;
      callback();
    });

    var options = { limit: 5, sort: [ [ 'create_at', 'desc' ] ]};  //[ 'last_reply_at', 'desc' ]
    if (NEWS_board_id === false) {
      BoardProxy.getBoardByShortcut('news', function (err, board) {
        if (err || !board) {
          NEWS_board_id = null;
          return;
        }
        NEWS_board_id = board._id;
        var query = { board_id: NEWS_board_id };
        TopicProxy.getTopicsByQuery(query, options, ep.done('latest_topics'));
      });
    } else if (NEWS_board_id) {
      var query = { board_id: NEWS_board_id };
      TopicProxy.getTopicsByQuery(query, options, ep.done('latest_topics'));
    } else {
      ep.emit('latest_topics', null);
    }
    
  };

}).call(this);