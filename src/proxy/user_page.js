var models = require('../model');
var UserPageRelationProxy = require('./user_page_relation');
var UserPage = models.UserPage;
var UserPageRelation = models.UserPageRelation;
var functions = require("./../common/functions"),
  string = require("./../common/string"),
  constdata = require("./../common/constdata");
var permission = constdata.permission;

exports.updateById = function (id, updateData, callback) {
  UserPage.update({_id: id}, {$set: updateData}, callback);
};

/**
 * 根据用户名列表查找用户列表
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} names 用户名列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByNames = function (names, callback) {
  if (names.length === 0) {
    return callback(null, []);
  }
  var _names = names.concat();
  for (var i = 0; i < _names.length; i++) {
    _names[i] = string.clean(_names[i]);
  }
  UserPage.find({ name_clean: { $in: _names } }, callback);
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
  UserPage.findOne({_id: id}, callback);
};

/**
 * 根据用户名，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {Function} callback 回调函数
 */
exports.getUserByName = function (name, callback) {
  var nameClean = string.clean(name);
  UserPage.findOne({name_clean: nameClean}, callback);
};

exports.getUserByNameClean = function (nameClean, callback) {
  UserPage.findOne({name_clean: nameClean}, callback);
};

/**
 * 根据邮箱，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} email 邮箱地址
 * @param {Function} callback 回调函数
 */
exports.getUserByMail = function (email, callback) {
  UserPage.findOne({email: email}, callback);
};

/**
 * 根据用户ID列表，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} ids 用户ID列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByIds = function (ids, callback) {
  UserPage.find({'_id': {'$in': ids}}, callback);
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

exports.getDefaultPages = function (accountIds, callback) {
  UserPageRelation.find({account_id: { $in: accountIds }}, function (err, r) {
    if (err) {
      callback(err);
      return;
    }
    var page_ids = [];
    for (var i = 0; i < r.length; i++) {
      page_ids.push(r[i].page_id);
    }
    if (page_ids.length > 0) {
      exports.getUsersByIds(page_ids, function (err, pages) {
        if (err) {
          callback(err, null, r);
          return;
        }
        var filtered = pages.filter(function (item) {
          return !item.noaccount;
        });
        callback(null, filtered, r);
      });
    } else {
      callback(new Error('none'));
    }
  });
};

exports.newAndSave = function (accountId, accountPower, noaccount, name, bio, avatar_url, cover_url, callback, permission) {
  var user = new UserPage();
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

exports.urpNewAndSave = function (name, flags, callback) {
  var user = new UserPage();
  user.name = name;
  user.name_clean = string.clean(name);
  user.noaccount = true;
  user.permission = permission.ADD_COURSEWARE | permission.MANAGE_COURSEWARE;
  user.flags = flags;
  user.save(callback);
};
