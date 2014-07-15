var models = require('../model');
var UserUrp = models.UserUrp;

exports.getUrp = function (id, callback) {
  UserUrp.findOne({_id: id}, callback);
};

exports.getUrpByUserId = function (pageId, callback) {
  UserUrp.findOne({page_id: pageId}, callback);
};

exports.getUrpsByIds = function (ids, callback) {
  UserUrp.find({_id: {'$in': ids}}, callback);
};

exports.newAndSave = function (pageId, username, password, cookie, callback) {
  var content = new UserUrp();
  content.page_id = pageId;

  content.username = username;
  content.password = password;
  content.cookie = cookie;

  content.save(callback);
};

exports.remove = function (id, callback) {
  UserUrp.remove({_id: id}, callback);
};

exports.removeByUserId = function (pageId, callback) {
  UserUrp.remove({page_id: pageId}, callback);
};
