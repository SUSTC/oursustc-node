//var EventProxy = require('eventproxy');

var models = require('../model');
/*Database Model Import*/
var User = models.UserAccount;
var Enigma = models.EnigmaUser,
    EnigmaCli = models.EnigmaClient;

var functions = require("./../common/functions"),
  	string = require("./../common/string"),
  	constdata = require("./../common/constdata");

var FC = module.exports;

function Ipv4Test(ip){
  var numpattern = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
  return ip && numpattern.test(ip);
}

/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
  Enigma.findOne({_id: id}, callback);
};

/**
 * 根据用户Account，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} account 用户studentID
 * @param {Function} callback 回调函数
 */
exports.getUserByAccount = function (account, callback) {
  Enigma.findOne({studentID: account}, callback);
};

/**
 * 根据用户Account，查找用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} status 用户abolishFlag
 * @param {Function} callback 回调函数
 */
exports.getUsersByStatus = function (status, callback) {
  if(status) status = false;
  else status = true;
  Enigma.findOne({abolishFlag: status}, callback);
};


/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * @param {String} id/account 用户关键字
 * @param {Object} updateData 更新数据
 * @param {Function} callback 回调函数
 */
exports.updateAccountInfo = function (account, updateData, callback) {
  Enigma.update({studentID: account}, {$set: updateData}, callback);
};
exports.updateById = function (id, updateData, callback) {
  Enigma.update({_id: id}, {$set: updateData}, callback);
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - message, 返回信息
 * @param {String} account 用户关键字
 * @param {Object} newClient 更新数据
 * @param {Function} callback 回调函数
 */
exports.addClient = function (account, newClient, callback) {
  FC.getUserByAccount(account, function(err, user){
    if(err || !user) 
      return callback(-1, "NO_USER_ACCOUNT");

    if (user.onlineClient.length >= user.clientCount)
      return callback(-1, "CLIENT_LIMIT_EXCEED");

    if(!newClient.lanIP || !newClient.wanIP)
      return callback(-1, "IP_FORMAT_ERROR");

    newClient = {
      lanIP: newClient.lanIP, 
      wanIP: newClient.wanIP, 
      onlineTime: Date.now()
    };
    newClient = new EnigmaCli(newClient);

    user.onlineClient.push(newClient);
    user.last_connect_time = Date.now();
    user.clientCount += 1;

    user.save(function(err){
      if(err) return callback(-1, "DB_ERROR");
      return callback(0, "SAVE_SUCCESS");
    });
  });
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - message, 返回信息
 * @param {String} account 用户关键字
 * @param {Object} newClient 更新数据
 * @param {Function} callback 回调函数
 */
exports.findClient = function (user, wanIP) {
  var enigma_len = user.onlineClient.length;
  for (var i = 0; i < enigma_len; i++) {
    if (user.onlineClient[i].wanIP == wanIP)
      return i;
  }
  return -1;
};

exports.newAndSave = function (studentID, clientCount, upThresold, downThreshold, allowedFlow, activate, callback) {
  var Enigma = new Enigma();
  Enigma.studentID = studentID;
  Enigma.clientCount = clientCount;
  Enigma.upThresold = upThresold;
  Enigma.downThreshold = downThreshold;
  Enigma.allowedFlow = allowedFlow;

  Enigma.abolishFlag = !activate;

  Enigma.save(callback);
};

