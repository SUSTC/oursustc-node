var models = require('../model');
var Message = models.Notification;
var User = require('../proxy').User;
var messageProxy = require('../proxy/notification');
var mail = require('./mail');

var _ = require('underscore');

function isExists(author_ids, author_id) {
  /*var str_author_id = author_id.toString();
  var str_author_ids = [];
  _.each(author_ids, function (aid) {
    str_author_ids.push(aid.toString());
  });*/
  return (author_ids.indexOf(author_id) !== -1);
}

exports.sendReplyMessage = function (master_id, author_id, topic_id, reply_id) {
  var fn_save = function (err) {
    // TODO: 异常处理
    return;
    User.getUserById(master_id, function (err, master) {
      // TODO: 异常处理
      if (master && master.receive_reply_mail) {
        message.has_read = true;
        message.save();
        messageProxy.getMessageById(message._id, function (err, msg) {
          msg.reply_id = reply_id;
          // TODO: 异常处理
          mail.sendReplyMail(master.email, msg);
        });
      }
    });
  };
  messageProxy.getLastUnreadMessage('reply', master_id, topic_id, function (err, msg) {
    if (msg) {
      if (isExists(msg.author_id, author_id)) {
        return;
      }
      msg.author_id.push(author_id);
      msg.update_at = Date.now();
      msg.save(fn_save);
      return;
    }

    var message = new Message();
    message.type = 'reply';
    message.master_id = master_id;
    message.author_id = [author_id];
    message.topic_id = topic_id;
    message.reply_id = reply_id;
    message.save(fn_save);
  });
};

exports.sendReply2Message = function (master_id, author_id, topic_id, reply_id) {
  var fn_save = function (err) {
    // TODO: 异常处理
    return;
    User.getUserById(master_id, function (err, master) {
      // TODO: 异常处理
      if (master && master.receive_reply_mail) {
        message.has_read = true;
        message.save();
        messageProxy.getMessageById(message._id, function (err, msg) {
          msg.reply_id = reply_id;
          // TODO: 异常处理
          mail.sendReplyMail(master.email, msg);
        });
      }
    });
  };
  messageProxy.getLastUnreadMessage('reply2', master_id, topic_id, function (err, msg) {
    if (msg) {
      if (isExists(msg.author_id, author_id)) {
        return;
      }
      msg.author_id.push(author_id);
      msg.update_at = Date.now();
      msg.save(fn_save);
      return;
    }
    var message = new Message();
    message.type = 'reply2';
    message.master_id = master_id;
    message.author_id = [author_id];
    message.topic_id = topic_id;
    message.reply_id = reply_id;
    message.save();
  });
};

exports.sendAtMessage = function (master_id, author_id, topic_id, reply_id, callback) {
  var message = new Message();
  message.type = 'at';
  message.master_id = master_id;
  message.author_id = [author_id];
  message.topic_id = topic_id;
  message.reply_id = reply_id;
  message.save(function (err) {
    // TODO: 异常处理
    return;
    User.getUserById(master_id, function (err, master) {
      // TODO: 异常处理
      if (master && master.receive_at_mail) {
        message.has_read = true;
        message.save();
        messageProxy.getMessageById(message._id, function (err, msg) {
          // TODO: 异常处理
          mail.sendAtMail(master.email, msg);
        });
      }
    });
    callback(err);
  });
};

exports.sendFollowMessage = function (follow_id, author_id) {
  messageProxy.getLastUnreadMessage('follow', follow_id, null, function (err, msg) {
    if (msg) {
      if (isExists(msg.author_id, author_id)) {
        return;
      }
      msg.author_id.push(author_id);
      msg.update_at = Date.now();
      msg.save(fn_save);
      return;
    }
    var message = new Message();
    message.type = 'follow';
    message.master_id = follow_id;
    message.author_id = [author_id];
    message.save();
  });
};
