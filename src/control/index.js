
(function() {

  var EventProxy = require('eventproxy');

  var proxy = require("./../proxy"),
    TopicProxy = proxy.Topic;
  var TopicType = require("./../class/topic").TopicType;

  exports.index = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.index;
    data.active = 'index';

    var events = ['latest_topics'];
    var ep = EventProxy.create(events, function (latest_topics) {
      data.latest_topics = latest_topics;
      callback();
    });

    var options = { limit: 5, sort: [ [ 'create_at', 'desc' ] ]};  //[ 'last_reply_at', 'desc' ]
    var query = { type: TopicType.NEWS };
    TopicProxy.getTopicsByQuery(query, options, ep.done('latest_topics'));
  };

}).call(this);