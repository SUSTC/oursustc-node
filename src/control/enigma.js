(function() {

  var EventProxy = require('eventproxy');

  //table = require("./../base/table");
  var config = require('./../config/config.json');
  var functions = require("./../common/functions"),
    string = require("./../common/string"),
    constdata = require("./../common/constdata"),
    proxy = require("./../proxy"),
    EnigmaProxy  = proxy.Enigma,
    UserAccountProxy = proxy.UserAccount;

  exports.index = function(req, res, data, callback) {
    data.err = 0;
    data.title = "Hello World!";
    callback(true);
  };

  exports.online = function(req, res, data, callback) {
    data.err = 0;
    data.message = "Online Client:";
    callback(true);
  };

  exports.auth = function(req, res, data, callback) {
    var account = req.body.username,
        pwd  = req.body.password;

    if (!account || !pwd){
      data.err = 1;
      data.message = "FORMAT_ERROR";
      return callback(true);
    }

    var getFunc = UserAccountProxy.getUserByStudentId;
    if (!string.is_numeric(account)) {
      //非学号
      getFunc = UserAccountProxy.getUserByLoginName;
    }

    getFunc(account, function (err, user) {

      if (err || !user) {
        data.err = 1;
        data.message = "Auth_Error_Account";
        return callback(true);
      }
      account = user.student_id;
      if (functions.password_check_hash(pwd, user.password) && user.activate) {
        Enigma.getUserByAccount(account, function(err, enigma){
          if(err) {
            data.err = -1;
            data.message = "DB_ERROR";
            return callback(true);
          }

          if(!user) {
            data.err = 0;
            data.message = "USER_ADD";
            Enigma.newAndSave(account, callback(true));
            return;
          }

          enigma.last_auth_time = Date.now();
          if (enigma.rx_bytes + enigma.tx_bytes >= allowed_bytes){
            data.err = 2;
            data.message = "FLOW_EXCEED";
          }
          else if (enigma.onlineClient.length >= enigma.clientCount){
            data.err = 3;
            data.message = "COUNT_EXCEED";
          }
          else {
            data.err = 0;
            data.message = "SUCCESS";
          }

          enigma.save(function(err){
            if(err){
              data.err = -1;
              data.message = "DB_ERROR";
              return callback(true);
            }
            return callback(true);
          });

        });
      } 
      else {
        data.err = 1;
        data.message = "Auth_Error_Password";
        return callback(true);
      }
    });
    callback(true);
  }

  exports.connect = function(req, res, data, callback) {
    var account = req.body.username,
        lan_ip   = req.body.ifconfig_pool_local_ip,
        wan_ip   = req.body.ifconfig_pool_remote_ip;

    if (!account || !lan_ip || !wan_ip){
      data.err = 1;
      data.message = "FORMAT_ERROR";
      return callback(true);
    }

    var newClient = {
      lanIP: lan_ip,
      wanIP: wan_ip,
    }

    Enigma.addClient(account, newClient, function(err, msg){
      if(err != 0){
        data.err = -1;
        data.message = "DB_ERROR";
      }
      else{
        data.err = 1;
        data.message = "SUCCESS";
      }
      return callback(true);
    });

  }

  exports.disconnect = function(req, res, data, callback) {
    var account = req.body.username,
        lan_ip  = req.body.ifconfig_pool_local_ip,
        wan_ip  = req.body.ifconfig_pool_remote_ip,
        rx_bytes= req.body.bytes_received,
        tx_bytes= req.body.bytes_sent;

    if (!account || !lan_ip || !wan_ip || !rx_bytes || !tx_bytes){
      data.err = 1;
      data.message = "FORMAT_ERROR";
      return callback(true);
    }

    Enigma.getUserByAccount(account, function(err, user) {
      if(err) {
        data.err = -1;
        data.message = "DB_ERROR";
        return callback(true);
      }

      var index = Enigma.findClient(user, wan_ip);
      if (index != -1){
        user.last_disconnect_time = Date.now();
        user.tx_bytes += tx_bytes;
        user.rx_bytes += rx_bytes;
        user.onlineClient.splice(index, 1);

        user.save(function(err){
          if(err) {
            data.err = -1;
            data.message = "DB_ERROR";
            return callback(true);
          }
          else{
            data.err = 0;
            data.message = "SUCCESS";
            return callback(true);
          }
        });
      }
      else{
        data.err = -1;
        data.message = "DB_ERROR";
        return callback(true);
      }
    });
  }

  exports.reconnect = function(req, res, data, callback) {

    data.err = 0;
    callback(true);
    
  };
}).call(this);
