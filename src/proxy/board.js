var EventProxy = require('eventproxy');

var models = require('../model');
var Board = models.Board;
var string = require("./../common/string");

/**
 * 根据板块ID，获取该板块
 * @param {String} id 板块ID
 * @param {Function} callback 回调函数
 */
exports.getBoard = function(id, callback) {
  Board.findOne({
    _id: id
  }, callback);
};

exports.getBoardById = function(id, callback) {
  Board.findOne({
    _id: id
  }, callback);
};

exports.getBoardByShortcut = function(shortcut, callback) {
  var shortcut_clean = string.clean(shortcut);
  Board.findOne({
    shortcut: shortcut_clean
  }, callback);
};

exports.newAndSave = function(shortcut, name, type, access, description, parent, callback) {
  var board = new Board();
  var shortcut_clean = string.clean(shortcut);
  board.shortcut = shortcut_clean;
  board.name = name;
  board.type = type;
  board.access = access;
  board.description = description;
  if (parent) {
    board.parent = parent;
  }
  board.save(callback);
};

exports.findChildrenById = function(parent_id, callback) {
  Board.find({
    parent: parent_id
  }, callback);
};

exports.fetchAll = function(callback) {
  Board.find(callback);
};
