(function() {

  var util = require('util');
  var EventProxy = require('eventproxy');
  var Util = require('../common/util');
  var _ = require('underscore');
  var markdown = require('../common/markdown').Markdown;
  var sanitize = require('validator').sanitize;

  var view = require("./../common/view"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    constdata = require("./../common/constdata"),
    model = require("./../model"),
    proxy = require("./../proxy"),
    config = require("./../config/config.json"),
    UserPageProxy = proxy.UserPage,
    BoardProxy = proxy.Board,
    TopicProxy = proxy.Topic,
    TopicAttachmentProxy = proxy.TopicAttachment,
    ReplyProxy = proxy.Reply;

  var at = require("./../services/at"),
    message = require("./../services/notification");

  var permission = constdata.permission;

  //Waiting for mod to BoardId
  var TOPIC_TYPE = {};

  function Topic(shortcut) {
    this.init(shortcut);
  }

  Topic.prototype.init = function(shortcut) {
    this.shortcut = shortcut;
    this.active = 'board/' + shortcut;
    this.board = null;
  };

  Topic.prototype.canView = function(res) {
    /*if ((this.type == TOPIC_TYPE.COURSEWARE || this.type == TOPIC_TYPE.BBS) && !res.locals.core.isLogin()) {
      
    }*/
    if (this.board.access & constdata.board_permission.NOACCOUNT_ACCESS) return true;

    if (!res.locals.core.isLogin()) {
      return false;
    }

    switch (res.locals.core.user.accounttype){
      case constdata.account_type.STUDENT:
        if(this.board.access & constdata.board_permission.STUDENT_ACCESS) return true;
        break;
      case constdata.account_type.TEACHER:
        if(this.board.access & constdata.board_permission.TEACHER_ACCESS) return true;
        break;
      case constdata.account_type.EXTERNAL:
        if(this.board.access & constdata.board_permission.EXTERNAL_ACCESS) return true;
        break;
    }

    if (this.board.administrator_ids.indexOf(res.locals.core.user.page_id) !== -1) return true;

    return false;
  };

  Topic.prototype.canPost = function(res) {
    if (!res.locals.core.isLogin()) {
      return false;
    }

    switch(res.locals.core.user.accounttype){
      case constdata.account_type.STUDENT:
        if(this.board.access & constdata.board_permission.STUDENT_POST) return true;
        break;
      case constdata.account_type.TEACHER:
        if(this.board.access & constdata.board_permission.TEACHER_POST) return true;
        break;
      case constdata.account_type.EXTERNAL:
        if(this.board.access & constdata.board_permission.EXTERNAL_POST) return true;
        break;
    }

    if (this.board.administrator_ids.indexOf(res.locals.core.user.page_id) !== -1) return true;
    
    return false;
  };

  Topic.prototype.canManage = function(res, topic) {
    if (!res.locals.core.isLogin()) {
      return false;
    }

    if (topic.author_id == res.locals.core.user.page_id) return true;

    if (res.locals.core.user.page.permission & constdata.user_permission.DASHBOARD) return true;

    if (this.board.administrator_ids.indexOf(res.locals.core.user.page_id) !== -1) return true;

    return false;
  };

  Topic.prototype.canSet = function(res, topic) {
    if (!res.locals.core.isLogin()) {
      return false;
    }

    if (res.locals.core.user.page.permission & constdata.user_permission.DASHBOARD) return true;

    if (this.board.administrator_ids.indexOf(res.locals.core.user.page_id) !== -1) return true;

    return false;
  };

  Topic.prototype.canReply = function(res, topic) {
    return true;
  }; // STUB: Can reply

  Topic.prototype.getBoard = function (req, res, data, rescallback, callback) {
    var that = this;
    if (this.shortcut) {
      BoardProxy.getBoardByShortcut(this.shortcut, function (err, board) {
        if (err || !board) {
          view.showMessage(data, res.locals.core.lang.errmsg.board_not_found, 'error', '/board', rescallback);
          return;
        }
        that.board = board;
        callback();
      });
    } else {
      var topic_id = req.params.id;
      if (!topic_id && req.body.topic) {
        topic_id = req.body.topic.id;
      }
      if (topic_id && string.is_objectid(topic_id)) {
        TopicProxy.getTopic(topic_id, function (err, topic) {
          if (err || !topic) {
            view.showMessage(data, res.locals.core.lang.topic.topics_not_found, 'error', '/board', rescallback);
            return;
          }
          that.topic = topic;
          if (topic.board_id) {
            BoardProxy.getBoard(topic.board_id, function (err, board) {
              if (err || !board) {
                view.showMessage(data, res.locals.core.lang.errmsg.board_not_found, 'error', '/board', rescallback);
                return;
              }
              that.board = board;
              that.active = 'board/' + board.shortcut;
              callback();
            });
          }
        });
      } else {
        view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/board', rescallback);
        return;
      }
    }
  };

  Topic.prototype.getboardstree = function(callback) {
    // All preprocessing completed, Render the page
    var e = EventProxy.create(['render'], function(boards) {
      callback(null, boards);
    });
    // Tree has been built, Do preprocessing here PLS
    e.once('treebuilt', function(tree) {
      var record = tree; //This is for debugging only
      /*
      var dumptree = function(tree, level) {
        if (tree)
          for (var i in tree) {
            console.log(level, tree[i]._id);
            dumptree(tree[i].children, level + 1);
          }
      }
      dumptree(tree, 1); // For debugging
      */
      e.emit('render', record)
    });
    e.fail(function (err) {
      callback(err);
    });
    //Here we build the tree structure BEGIN
    BoardProxy.fetchAll(function(err, list) {
      var tree = {};
      // build function BEGIN
      var build = function(parent) {
        var current = parent;
        current.children = {};

        for (var i = 0; i < list.length; i++) {
          if ((typeof(list[i].parent) !== 'undefined') && (list[i].parent == parent._id.toString())) {
            var child = build(list[i]);
            current.children[child._id] = child;
          }
        }
        return current;
      };
      // build function END

      for (var i = 0; i < list.length; i++) {
        if (list[i].parent == null) {
          var child = build(list[i]);
          tree[child._id] = child;
        }
      }
      e.emit('treebuilt', tree);
    });
    // Tree building END
  };

  Topic.prototype.index = function(req, res, data, callback) {
    var that = this;
    this.getBoard(req, res, data, callback, function (err) {
      that._index(req, res, data, callback);
    });
  };

  Topic.prototype._index = function(req, res, data, callback) {

    if (!this.canView(res)) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
      return;
    }
    data.canPost = this.canPost(res);

    var limit = view.PAGINATION_LIMIT;

    var page = parseInt(req.query.p, 10) || 1;
    var query = {
      'board_id': this.board._id
    };
    var options = {
      skip: (page - 1) * limit,
      limit: limit,
      sort: [
        ['top', 'desc'],
        ['last_reply_at', 'desc']
      ]
    };

    var events = ['topics', 'pagination'];
    var that = this;
    var ep = EventProxy.create(events, function(topics, pagination) {

      for (var i in topics) {
        topics[i].friendly_create_at = Util.format_date(topics[i].create_at, true);
        topics[i].friendly_update_at = Util.format_date(topics[i].update_at, true);
        topics[i].friendly_last_reply_at = Util.format_date(topics[i].last_reply_at, true);
        if (res.locals.core.api) {
          var _author = JSON.parse(JSON.stringify(topics[i].author));
          topics[i] = JSON.parse(JSON.stringify(topics[i]));
          topics[i].author = _author;
        }
      }

      data.title = that.board.name + ' - ' + data.title;
      data.board = that.board;

      data.topics = topics;
      data.pagination = pagination;
      callback();
    });

    TopicProxy.getTopicsByQuery(query, options, ep.done('topics'));

    // 取分页数据
    var active = this.active;
    TopicProxy.getCountByQuery(query, ep.done(function(all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      var pagination = view.pagination(page, pages, '/' + active);
      ep.emit('pagination', pagination);
    }));
  };

  Topic.prototype.list = function(req, res, page_ids, data, callback) {
    //can view
    if (!res.locals.core.isLogin()) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
      return;
    }

    //all cannot post in list
    data.canPost = false;

    var limit = view.PAGINATION_LIMIT;

    var page = parseInt(req.query.p, 10) || 1;
    var query = {
      //'board_id': this.type,
      'author_id': {
        $in: page_ids
      }
    };
    var options = {
      skip: (page - 1) * limit,
      limit: limit,
      sort: [
        ['top', 'desc'],
        ['last_reply_at', 'desc']
      ]
    };

    var events = ['topics', 'pagination'];
    var ep = EventProxy.create(events, function(topics, pagination) {
      for (var i in topics) {
        topics[i].friendly_create_at = Util.format_date(topics[i].create_at, true);
        topics[i].friendly_update_at = Util.format_date(topics[i].update_at, true);
        topics[i].friendly_last_reply_at = Util.format_date(topics[i].last_reply_at, true);
        if (res.locals.core.api) {
          var _author = JSON.parse(JSON.stringify(topics[i].author));
          topics[i] = JSON.parse(JSON.stringify(topics[i]));
          topics[i].author = _author;
        }
      }
      data.topics = topics;
      data.pagination = pagination;
      callback();
    });

    var active = this.active;
    ep.fail(function(err) {
      data.topics = [];
      data.pagination = view.pagination(0, 0, '/' + active);
      callback();
    });

    TopicProxy.getTopicsByQuery(query, options, ep.done('topics'));

    // 取分页数据
    TopicProxy.getCountByQuery(query, ep.done(function(all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      var pagination = view.pagination(page, pages, '/' + active);
      ep.emit('pagination', pagination);
    }));
  };

  Topic.prototype.show = function(req, res, data, callback) {
    var that = this;
    this.getBoard(req, res, data, callback, function (err) {
      that._show(req, res, data, callback);
    });
  };

  Topic.prototype._show = function(req, res, data, callback) {

    var type = this.type;
    var topic_id = req.params.id;

    var showallreply = req.query.full;
    var folding = true;
    if (showallreply && parseInt(showallreply)) {
      folding = false;
    }

    if (!this.canView(res)) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
      return;
    }

    var events = ['topic', 'other_topics'];
    var ep = EventProxy.create(events, function(topic, other_topics) {
      data.topic = topic;
      data.board = that.board;
      data.author_other_topics = other_topics;
      data.folded_count = (topic.reply_count - topic.replies.length);
      if (topic.title) {
        data.title = topic.title + ' - ' + data.title;
      }
      callback();
    });

    ep.fail(function (err) {
      console.error(err);
      callback(true, {err: 500});
    });

    var active = this.active;
    var that = this;
    TopicProxy.getFullTopic(topic_id, folding, ep.done(function(message, topic, tags, attachments, author, replies) {

      if (message) {
        //err msg
      }

      if (topic) {

        var _canManage = that.canManage(res, topic);
        var _canSet = that.canSet(res, topic);
        
        topic.visit_count += 1;
        topic.save(ep.done(function() {
          // format date
          topic.friendly_create_at = Util.format_date(topic.create_at, true);
          topic.friendly_update_at = Util.format_date(topic.update_at, true);

          topic.tags = tags;


          if (replies) {
            for (var i = 0; i < replies.length; i++) {
              replies[i].content = markdown(replies[i].content);
            }
          }

          if (res.locals.core.api) {
            topic = JSON.parse(JSON.stringify(topic));
            topic.author = JSON.parse(JSON.stringify(author));
            var _replies = JSON.parse(JSON.stringify(replies));
            for (var i = 0; i < _replies.length; i++) {
              _replies[i].author = JSON.parse(JSON.stringify(replies[i].author));
            }
            topic.replies = _replies;
          } else {
            topic.author = author;
            topic.replies = replies;
          }

          topic.attachments = attachments;

          topic.canManage = _canManage;
          topic.canSet = _canSet;

          topic.content = markdown(topic.content);

          ep.emit('topic', topic);
        }));

        var options = {
          limit: 5,
          sort: [
            ['create_at', 'desc']
          ]
        }; //[ 'last_reply_at', 'desc' ]
        var query = {
          //type: type,
          author_id: topic.author_id,
          _id: {
            '$nin': [topic._id]
          }
        };
        TopicProxy.getTopicsByQuery(query, options, ep.done('other_topics'));
      } else {
        view.showMessage(data, res.locals.core.lang.topic.topic_not_found, 'error', '/' + active, callback);
      }
    }));
  };

  Topic.prototype.add = function(req, res, data, callback) {
    var that = this;
    this.getBoard(req, res, data, callback, function (err) {
      that._add(req, res, data, callback);
    });
  };

  Topic.prototype._add = function(req, res, data, callback) {

    if (!this.canView(res) || !this.canPost(res)) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', callback);
      return;
    }

    if (req.method == 'POST') {

      var title, content;

      if (!res.locals.core.user.checkcsrf(req.body.csrf)) {
        view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/' + this.active + '/add', callback);
        return;
      }

      if (req.body.topic) {
        title = req.body.topic.title;
        content = req.body.topic.content;

        if (title) {
          title = sanitize(title).trim();
          title = sanitize(title).xss();
        }
      }

      if (title && title.length <= 30 && content) {
        var active = this.active;

        TopicProxy.newAndSave(this.board._id, title, content, res.locals.core.user.page_id, function(err, topic) {
          if (err) {
            view.showMessage(data, String(err), 'error', '/' + active + '/add', callback);
          } else {
            var ep = EventProxy.create();
            ep.all('attachment_saved', 'score_saved', function(reply) {
              view.showMessage(data, '', 'success', '/topic/' + topic._id, callback);
            });

            //发送at消息
            at.sendMessageToMentionUsers(content, topic._id, res.locals.core.user.page_id, null);

            UserPageProxy.getUserById(res.locals.core.user.page_id, ep.done(function(user) {
              //user.score += 5;
              user.topic_count += 1;
              user.save();
              //req.session.user.score += 5;
              ep.emit('score_saved');
            }));

            var attachmentIds = req.body.topic.attachment;
            if (attachmentIds && (attachmentIds instanceof Array) && attachmentIds.length > 0) {
              var errIds = false;
              //check first
              for (var i = 0; i < attachmentIds.length; i++) {
                if (!string.is_objectid(attachmentIds[i])) {
                  errIds = true;
                  break;
                }
              }
              if (!errIds) {
                //add attachment
                TopicAttachmentProxy.newAndSave(topic._id, attachmentIds, function(err) {
                  ep.emit('attachment_saved', true);
                });
                return;
              }
            }
            ep.emit('attachment_saved', null);
          }
        });
      } else {
        view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/' + this.active + '/add', callback);
      }
    } else {
      callback();
    }

  };

  Topic.prototype.set = function(req, res, data, callback) {
    var that = this;
    if (!res.locals.core.isLogin()) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', callback);
      return;
    }
    var r = {err: -1};
    if (req.method == 'POST') {
      var topic_id;
      if (req.body.topic) {
        topic_id = req.body.topic.id;
      } else {
        callback(true, r);
        return;
      }

      if (!res.locals.core.user.checkcsrf(req.body.csrf)) {
        r.err = 1;
        callback(true, r);
        return;
      }

      this.getBoard(req, res, data, callback, function (err) {
        TopicProxy.getTopic(topic_id,  function(err, topic) {
          var _canSet = that.canSet(res, topic);
          if (!_canSet) {
            r.err = 2;
            callback(true, r);
            return;
          }

          var seted = false;
          if (req.body.topic.top !== undefined) {
            seted = true;
            switch (req.body.topic.top) {
            case 'true':
              topic.top = true;
              break;
            case 'false':
              topic.top = false;
              break;
            default:
              seted = false;
              break;
            }
          }

          r.err = 0;
          if (seted) {
            topic.save(function () {
              callback(true, r);
            });
          } else {
            callback(true, r);
          }

        });
      });

      return;
    }
    callback(true, r);
  };

  Topic.prototype.edit = function(req, res, data, callback) {
    var that = this;
    this.getBoard(req, res, data, callback, function (err) {
      that._edit(req, res, data, callback);
    });
  };

  Topic.prototype._edit = function(req, res, data, callback) {

    var type = this.type;
    var topic_id = req.params.id;

    if (!res.locals.core.isLogin()) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', callback);
      return;
    }

    if (req.method == 'POST') {
      if (req.body.topic) {
        topic_id = req.body.topic.id;
      }
      if (!res.locals.core.user.checkcsrf(req.body.csrf)) {
        view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/topic/edit/' + topic_id, callback);
        return;
      }
    }

    var active = this.active;
    var that = this;
    TopicProxy.getFullTopic(topic_id, function(err, message, topic, tags, attachments, author, replies) {
      if (topic) {
        var _canManage = that.canManage(res, topic);
        if (!_canManage) {
          view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/topic/' + topic._id, callback);
          return;
        }

        if (req.method == 'POST') {
          var events = ['err', 'topic', 'new_attachments', 'del_attachments'];
          var ep = EventProxy.create(events, function(err, topic, newAttachments, delAttachments) {
            if (err) {
              view.showMessage(data, String(err), 'error', '/topic/edit/' + topic._id, callback);
            } else {
              view.showMessage(data, '', 'success', '/topic/' + topic._id, callback);
            }
          });

          var title, content;

          if (req.body.topic) {
            title = req.body.topic.title;
            content = req.body.topic.content;

            if (title) {
              title = sanitize(title).trim();
              title = sanitize(title).xss();
            }
          }

          if (!attachments) attachments = [];
          var attachmentIds = req.body.topic.attachment;
          var newAttachIds = [],
            delAttachIds = [];
          if (attachmentIds && (attachmentIds instanceof Array) && attachmentIds.length > 0) {
            var errIds = false;
            //check first
            for (var i = 0; i < attachmentIds.length; i++) {
              if (!string.is_objectid(attachmentIds[i])) {
                errIds = true;
                break;
              }
            }
            if (errIds) {
              view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/topic/edit/' + topic._id, callback);
              return;
            }

            for (var i = 0; i < attachmentIds.length; i++) {
              var exist = false;
              for (var j = 0; j < attachments.length; j++) {
                if (attachmentIds[i] == attachments[j]._id.toString()) {
                  exist = true;
                  break;
                }
              }
              if (!exist) {
                newAttachIds.push(attachmentIds[i]);
              }
            }

            for (var j = 0; j < attachments.length; j++) {
              var exist = false;
              for (var i = 0; i < attachmentIds.length; i++) {
                if (attachmentIds[i] == attachments[j]._id.toString()) {
                  exist = true;
                  break;
                }
              }
              if (!exist) {
                delAttachIds.push(attachments[j]._id);
              }
            }
          } else {
            for (var j = 0; j < attachments.length; j++) {
              delAttachIds.push(attachments[j]._id);
            }
          }

          if (newAttachIds.length > 0) {
            TopicAttachmentProxy.newAndSave(topic._id, newAttachIds, ep.done('new_attachments'));
          } else {
            ep.emit('new_attachments', []);
          }

          if (delAttachIds.length > 0) {
            TopicAttachmentProxy.remove(topic._id, delAttachIds, ep.done('del_attachments'));
          } else {
            ep.emit('del_attachments', []);
          }

          if (title && title.length <= 30 && content) {
            topic.title = title;
            topic.content = content;
            topic.update_at = new Date();
            topic.save(function(err, topic) {
              ep.emit('topic', topic);
              ep.emit('err', err);
            });
          } else {
            ep.emit('topic', topic);
            ep.emit('err', res.locals.core.lang.errmsg.error_params);
          }
          return;
        }
        data.topic = topic;
        data.topic.canManage = _canManage;
        data.topic.attachments = attachments;
        callback();
      } else {
        view.showMessage(data, res.locals.core.lang.topic.topic_not_found, 'error', '/' + active + '/add', callback);
      }
    });
  };

  Topic.prototype.delete = function(req, res, data, callback) {
    var that = this;
    this.getBoard(req, res, data, callback, function (err) {
      that._delete(req, res, data, callback);
    });
  };

  Topic.prototype._delete = function(req, res, data, callback) {

    var type = this.type;
    var topic_id = req.params.id;
    
    if (!res.locals.core.isLogin()) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', callback);
      return;
    }

    if (!res.locals.core.user.checkcsrf(req.query.csrf)) {
      view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/topic/' + topic_id, callback);
      return;
    }

    var active = this.active;
    var that = this;
    TopicProxy.getTopic(topic_id, function(err, topic) {
      if (topic) {
        var _canManage = that.canManage(res, topic);
        if (!_canManage) {
          view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/topic/' + topic._id, callback);
          return;
        }
        topic.remove(function(err) {
          TopicAttachmentProxy.removeByTopicId(topic._id, function(err) {
            view.showMessage(data, res.locals.core.lang.topic.topic_delete_succeed, 'success', '/' + active, callback);
          });
        });
      } else {
        view.showMessage(data, res.locals.core.lang.topic.topic_not_found, 'error', '/topic/edit/' + topic._id, callback);
      }
    });
  };

  Topic.prototype.reply = function(req, res, data, callback) {
    var that = this;
    var reply_id = req.params.id;
    if (reply_id && req.method != 'POST') {
      ReplyProxy.getReply(reply_id, function(err, reply) {
        var r = {};
        if (err) {
          r = {err: err};
        } else {
          r = {
            csrf: res.locals.core.user.csrf,
            reply: reply
          };
        }
        callback(true, r);
      });
      return;
    } else if (reply_id == 'edit' && req.method == 'POST') {
      var r = {err: 1};
      if (res.locals.core.user.checkcsrf(req.body.csrf)
          && req.body.reply) {
        reply_id = req.body.reply.id;
        r_content = req.body.reply.content;
        if (reply_id && r_content) {
          ReplyProxy.getReply(reply_id, function(err, reply) {
            if (err) {
              r = {err: err};
            } else if (!reply) {
              //...
            } else if (reply.author_id.toString() !== res.locals.core.user.page_id.toString()) {
              r = {err: 2};
            } else {
              if (reply.content != r_content) {
                reply.content = r_content;
                reply.update_at = Date.now();
                reply.save();
              }

              at.linkUsers(r_content, function (err, str) {
                if (err) {
                  r = {err: 3};
                } else {
                  r.err = 0;
                  r.reply = {
                    id: reply_id,
                    content: markdown(str)
                  };
                }
                callback(true, r);
              });
              return;
            }
            callback(true, r);
          });
          return;
        }
      }
      callback(true, r);
      return;
    }
    this.getBoard(req, res, data, callback, function (err) {
      that._reply(req, res, data, callback);
    });
  };

  Topic.prototype._reply = function(req, res, data, callback) {
    var type = this.type;
    var topic_id = req.params.id;

    if (!res.locals.core.isLogin()) {
      view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', callback);
      return;
    }

    if (req.method == 'POST') {
      var r_content = '';
      if (req.body.topic) {
        topic_id = req.body.topic.id;
        r_content = sanitize(req.body.topic.reply).trim();
      }
      if (!topic_id || !r_content) {
        view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/topic/edit/' + topic_id, callback);
        return;
      }
      if (!res.locals.core.user.checkcsrf(req.body.csrf)) {
        view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/topic/edit/' + topic_id, callback);
        return;
      }
    }

    var active = this.active;
    TopicProxy.getTopic(topic_id, function(err, topic) {
      if (topic) {
        if (req.method == 'POST') {

          var ep = EventProxy.create();
          ep.fail(function() {
            view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', '/topic/edit/' + topic_id, callback);
            return;
          });

          ep.all('reply_saved', 'topic', function (reply, topic) {
            if (topic.author_id.toString() !== res.locals.core.user.page_id.toString()) {
              message.sendReplyMessage(topic.author_id, res.locals.core.user.page_id, topic._id, reply._id);
            }
            ReplyProxy.getRepliesByTopicId(topic._id, function (err, replies) {
              if (replies) {
                var author_ids = [];
                for (var i = 0; i < replies.length; i++) {
                  author_ids.push(replies[i].author_id.toString());
                }
                var mention_ids = _.without(_.uniq(author_ids), res.locals.core.user.page_id.toString(), topic.author_id.toString());
                _.each(mention_ids, function (mention_id) {
                  message.sendReply2Message(mention_id, res.locals.core.user.page_id, topic._id, reply._id);
                });
              }
            });
            ep.emit('message_saved');
          });

          ep.emit('topic', topic);

          var r_content = req.body.topic.reply;
          ReplyProxy.newAndSave(r_content, topic_id, res.locals.core.user.page_id, ep.done(function(reply) {
            TopicProxy.updateLastReply(topic_id, reply._id, ep.done(function() {
              ep.emit('reply_saved', reply);

              //发送at消息
              at.sendMessageToMentionUsers(r_content, topic_id, res.locals.core.user.page_id, reply._id);
            }));
          }));

          UserPageProxy.getUserById(res.locals.core.user.page_id, ep.done(function(user) {
            //user.score += 5;
            user.reply_count += 1;
            user.save();
            //req.session.user.score += 5;
            ep.emit('score_saved');
          }));

          ep.all('reply_saved', 'message_saved', 'score_saved', function(reply) {
            if (res.locals.core.api) {
              var r = {
                err: {
                  no: 0
                },
                topic: topic,
                reply: reply
              };
              callback(true, r);
            } else {
              res.redirect('/topic/' + topic._id + '#' + reply._id);
              callback(true);
            }
          });
        } else {
          callback();
        }
      } else {
        view.showMessage(data, res.locals.core.lang.topic.topic_not_found, 'error', '/topic/edit/' + topic._id, callback);
      }
    });
  };

  exports.Topic = Topic;

}).call(this);
