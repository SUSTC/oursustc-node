var models = require('../model');
var UserWechat = models.UserWechat;

exports.get = function (id, callback) {
  UserWechat.findOne({_id: id}, callback);
};

exports.getByOpenId = function (openId, callback) {
  UserWechat.findOne({open_id: openId}, callback);
};

exports.newAndSave = function (openId, callback) {
  var content = new UserWechat();
  content.open_id = openId;
  content.save(callback);
};

exports.subscribe = function (openId, subscribe, callback) {
  UserWechat.update({open_id: openId}, {$set: {'subscribe': subscribe}}, callback);
};

exports.updateUserInfo = function (openId, user_id, student_id, callback) {
  UserWechat.update({open_id: openId}, {$set: {'user_id': user_id, 'student_id': student_id}}, callback);
};

exports.remove = function (id, callback) {
  UserWechat.remove({_id: id}, callback);
};

exports.removeByOpenId = function (openId, callback) {
  UserWechat.remove({open_id: openId}, callback);
};
