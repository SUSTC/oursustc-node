var models = require('../model');
var UserContent = models.UserContent;

exports.getContent = function (id, callback) {
  UserContent.findOne({_id: id}, callback);
};

exports.getContentsByUserId = function (pageId, callback) {
  UserContent.find({page_id: pageId}, callback);
};

exports.getContentsByIds = function (ids, callback) {
  UserContent.find({_id: {'$in': ids}}, callback);
};

exports.newAndSave = function (pageId, name, ext, type, path, callback) {
  var content = new UserContent();
  content.page_id = pageId;

  content.name = name;
  content.ext = ext;
  content.type = type;

  content.path = path;

  content.save(callback);
};

exports.remove = function (id, callback) {
  UserContent.remove({_id: id}, callback);
};
