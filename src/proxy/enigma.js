var EventProxy = require('eventproxy');

var models = require('../model');
var Enigma = models.EnigmaUser,
	EnigmaCli = models.EnigmaClient;

var User = require('./user_page');
var functions = require("./../common/functions"),
  	string = require("./../common/string"),
  	constdata = require("./../common/constdata");
var permission = constdata.permission;


/**SAMPLE
 * 根据主题ID获取主题
 * Callback:
 * - err, 数据库错误
 * - topic, 主题
 * - tags, 标签列表
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopicById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'tags', 'attachments', 'author'];
  proxy.assign(events, function (topic, tags, attachments, author) {
    return callback(null, topic, tags, attachments, author);
  }).fail(callback);

  Topic.findOne({_id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.emit('topic', null);
      proxy.emit('attachments', null);
      proxy.emit('author', null);
      return;
    }
    proxy.emit('topic', topic);

    User.getUserById(topic.author_id, proxy.done('author'));

    TopicAttachment.getAttachmentByTopicId(topic._id, proxy.done(function (topic_attachments) {
      if (topic_attachments && topic_attachments.length > 0) {
        var usercontent_ids = [];
        for (var i = 0; i < topic_attachments.length; i++) {
          usercontent_ids.push(topic_attachments[i].usercontent_id);
        }
        UserContent.getContentsByIds(usercontent_ids, proxy.done('attachments'));
      } else {
        proxy.emit('attachments', null);
      }
    }));

  }));
};

/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
  //UserPage.findOne({_id: id}, callback);
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getUsersByQuery = function (query, opt, callback) {
  UserPage.find(query, [], opt, callback);
};

/**
 * 根据查询条件，获取一个用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {String} key 激活码
 * @param {Function} callback 回调函数
 */
exports.getUserByQuery = function (name, key, callback) {
  UserPage.findOne({name: name, retrieve_key: key}, callback);
};

exports.updateById = function (id, updateData, callback) {
  UserPage.update({_id: id}, {$set: updateData}, callback);
};

exports.newAndSave = function (studentID, clientCount, upThresold, downThreshold, allowedFlow, callback) {
  var user = new Enigma();
  user.name = name;
  user.name_clean = string.clean(name);
  user.noaccount = noaccount;
  user.bio = bio;
  user.avatar = avatar_url;
  user.cover = cover_url;
  if (permission) {
    user.permission = permission;
  }
  if (accountId) {
    user.save(function (err, page) {
      if (err) {
        callback(err, page);
      } else {
        UserPageRelationProxy.newAndSave(
          accountId, page._id, accountPower,
          function (err, r) {
            callback(err, page, r);
          }
        );
      }
    });
  } else {
    user.save(callback);
  }
};