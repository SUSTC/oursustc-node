
(function() {

  var EventProxy = require('eventproxy');

  var view = require("./../common/view"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    proxy = require("./../proxy"),
    TopicProxy = proxy.Topic;

  var Topic = require("./../class/topic").Topic;

  function initData(res, data, subtitle) {
    if (subtitle) {
      data.title = subtitle + ' - ' + res.locals.core.lang.title.bbs.index;
    } else {
      data.title = res.locals.core.lang.title.bbs.index;
    }
    data.active = 'bbs';
  }

  exports.index = function(req, res, data, callback) {

    initData(res, data);

    var topic = new Topic('bbs');
    topic.index(req, res, data, callback);

  };

  exports.page = function(req, res, data, callback) {
    initData(res, data);

    var page_ids = [];
    var topic = new Topic('bbs');
    var page_id = req.params ? req.params.id : null;
    if (page_id && string.is_objectid(page_id)) {
      page_ids.push(page_id);
    }
    topic.list(req, res, page_ids, data, callback);
  };

  exports.topic = function(req, res, data, callback) {

    initData(res, data);

    var topic = new Topic('bbs');
    topic.show(req, res, data, callback);

  };

  exports.add = function(req, res, data, callback) {
    initData(res, data, res.locals.core.lang.topic.add);

    var topic = new Topic('bbs');
    topic.add(req, res, data, callback);
  };

  exports.edit = function(req, res, data, callback) {
    initData(res, data, res.locals.core.lang.topic.edit);

    var topic = new Topic('bbs');
    topic.edit(req, res, data, callback);
  };

  exports.delete = function(req, res, data, callback) {
    initData(res, data, res.locals.core.lang.topic.delete);

    var topic = new Topic('bbs');
    topic.delete(req, res, data, callback);
  };

  exports.reply = function(req, res, data, callback) {
    initData(res, data, res.locals.core.lang.topic.reply);

    var topic = new Topic('bbs');
    topic.reply(req, res, data, callback);
  };

}).call(this);