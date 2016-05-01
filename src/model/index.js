var mongoose = require('mongoose');
var config = require("./../config/config.json");

// models
require('./user_account');
require('./user_page');
require('./user_page_relation');
require('./user_content');
require('./user_urp');
require('./user_wechat');
require('./board');
require('./topic');
require('./topic_attachment');
require('./reply');
require('./notification');
require('./enigma');

exports.UserAccount = mongoose.model('UserAccount');
exports.UserPage = mongoose.model('UserPage');
exports.UserPageRelation = mongoose.model('UserPageRelation');
exports.UserContent = mongoose.model('UserContent');
exports.UserUrp = mongoose.model('UserUrp');
exports.UserWechat = mongoose.model('UserWechat');
exports.Board = mongoose.model('Board');
exports.Topic = mongoose.model('Topic');
exports.TopicAttachment = mongoose.model('TopicAttachment');
exports.Reply = mongoose.model('Reply');
exports.Notification = mongoose.model('Notification');
exports.EnigmaUser = mongoose.model('EnigmaUser');
exports.EnigmaClient = mongoose.model('EnigmaClient');