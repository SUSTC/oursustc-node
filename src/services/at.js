/*!
 * nodeclub - topic mention user controller.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * Copyright(c) 2012 muyuan
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var User = require('../proxy').UserPage;
var Message = require('./notification');
var EventProxy = require('eventproxy');

/**
 * 从文本中提取出@username 标记的用户名数组
 * @param {String} text 文本内容
 * @return {Array} 用户名数组
 */
var fetchUsers = function (text) {
  var atUserPatt = /@([^\s`]+?)[\s|$]/ig;
  var atUserPatt2 = /@`(.+?)`/ig;
  var names = [];
  do {
    result = atUserPatt.exec(text);
    if (result) {
      names.push(result[1]);
    }
  } while (result != null);
  do {
    result = atUserPatt2.exec(text);
    if (result) {
      names.push(result[1]);
    }
  } while (result != null);
  return names;
};

/**
 * 根据文本内容中读取用户，并发送消息给提到的用户
 * Callback:
 * - err, 数据库异常
 * @param {String} text 文本内容
 * @param {String} topicId 主题ID
 * @param {String} authorId 作者ID
 * @param {Function} callback 回调函数
 */
exports.sendMessageToMentionUsers = function (text, topicId, authorId, reply_id, callback) {
  if (typeof reply_id === 'function') {
    callback = reply_id;
    reply_id = null;
  }
  callback = callback || function () {};
  User.getUsersByNames(fetchUsers(text), function (err, users) {
    if (err || !users || users.length == 0) {
      return callback(err);
    }
    var ep = new EventProxy();
    var user_ids = [];

    var at_count = 0;
    users.forEach(function (user) {
      if (user._id != authorId) {
        at_count++;
      }
    });

    ep.after('sent', at_count, function () {
      callback(null, user_ids);
    }).fail(callback);

    users.forEach(function (user) {
      if (user._id != authorId) {
        user_ids.push(user._id);
        Message.sendAtMessage(user._id, authorId, topicId, reply_id, ep.done('sent'));
      }
    });
  });
};

/**
 * 根据文本内容，替换为数据库中的数据
 * Callback:
 * - err, 数据库异常
 * - text, 替换后的文本内容
 * @param {String} text 文本内容
 * @param {Function} callback 回调函数
 */
exports.linkUsers = function (text, callback) {
  User.getUsersByNames(fetchUsers(text), function (err, users) {
    if (err) {
      return callback(err);
    }
    for (var i = 0, l = users.length; i < l; i++) {
      var name = users[i].name;
      text = text.replace(new RegExp('@' + name + '|@`' + name + '`', 'gmi'), '@[' + name + '](/user/' + users[i]._id.toString() + ')');
    }
    return callback(null, text);
  });
};
