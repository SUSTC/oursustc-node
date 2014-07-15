var models = require('../model');
var Relation = models.UserPageRelation;

exports.getRelation = function (accountId, pageId, callback) {
  Relation.findOne({account_id: accountId, page_id: pageId}, callback);
};

exports.getRelationsByPageId = function (pageId, callback) {
  Relation.find({page_id: pageId}, callback);
};

exports.getPages = function (accountId, callback) {
  Relation.find({account_id: accountId}, callback);
};

/**
 * 创建新的关注关系
 * @param {ID} accountId 账户的id
 * @param {ID} pageId 用户页的id
 * @param {ID} power 账户对用户页的权限
 */
exports.newAndSave = function (accountId, pageId, power, callback) {
  var relation = new Relation();
  relation.account_id = accountId;
  relation.page_id = pageId;
  relation.power = power;
  relation.save(callback);
};

exports.urpNewAndSave = function (accountId, pageId, callback) {
  var relation = new Relation();
  relation.account_id = accountId;
  relation.page_id = pageId;
  relation.power = 1;
  relation.flags = 1;
  relation.save(callback);
};

/**
 * 删除的关注关系
 * @param {ID} accountId 账户的id
 * @param {ID} pageId 用户页的id
 */
exports.remove = function (accountId, pageId, callback) {
  Relation.remove({account_id: accountId, page_id: pageId}, callback);
};

exports.urpRemove = function (accountId, callback) {
  Relation.remove({account_id: accountId, flags: 1}, callback);
};
