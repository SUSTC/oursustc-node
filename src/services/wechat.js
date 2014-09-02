
var EventProxy = require('eventproxy');

var util = require("./../common/util"),
    functions = require("./../common/functions"),
    string = require("./../common/string");

var wechat = require('wechat');
var proxy = require("./../proxy"),
    UserAccountProxy = proxy.UserAccount,
    UserWechatProxy = proxy.UserWechat;

exports.Middleware = function () {
  return wechat('n40CPcPyf7371rHh', function (req, res, next) {
    var message = req.weixin;
    var open_id = message.FormUserName;

    switch (message.MsgType) {
      case 'event':
        if (message.Event == 'subscribe') {
          //订阅
          UserWechatProxy.getByOpenId(open_id, function (err, wx) {
            if (!wx) {
              UserWechatProxy.newAndSave(open_id, function (err, wx) {
                res.reply('感谢订阅南科大信息平台。\n'
                  + '\n'
                  + '请先在我们的网站上激活自己的账号 https://sustc.us\n'
                  + '默认的账号和密码都是学号。\n'
                  + '\n'
                  + '登录账号后就可以收到我们最新动态，可以用如下命令来登录自己的账号：\n'
                  + 'signin 学号:密码'
                  + '\n');
              });
            } else {
              var rtext = '欢迎继续订阅南科大信息平台。\n'
                  + '\n'
                  + '请先在我们的网站上激活自己的账号 https://sustc.us\n'
                  + '默认的账号和密码都是学号。\n'
                  + '\n'
                  + '登录账号后就可以收到我们最新动态，可以用如下命令来登录自己的账号：\n'
                  + 'signin 学号:密码'
                  + '\n';
              wx.subscribe = true;
              wx.save(
              //UserWechatProxy.subscribe(open_id, true,
                function (err, wx) {
                  if (wx.user_id) {
                    UserAccountProxy.getUserById(wx.user_id, function (err, user) {
                      if (!err && user) {
                        res.reply('欢迎回来，' + user.name + '。\n');
                      } else {
                        res.reply(rtext);
                      }
                    });
                  } else {
                    res.reply(rtext);
                  }
              });
            }
          });
          return;
        } else if (message.Event == 'unsubscribe') {
          UserWechatProxy.subscribe(open_id, false, function (err, wx) {
            res.reply('bye');
          });
          return;
        }
        break;
      case 'text':
        var content = message.Content;
        var m = content.match(/signin (\S+?):(.+?)$/);
        if (m) {
          if (string.is_numeric(m[1])) {
            UserAccountProxy.getUserByStudentId(m[1], function (err, user) {
              if (!err && user) {
                if (functions.password_check_hash(m[2], user.password)) {
                  if (!user.activate) {
                    res.reply('请先在我们的网站上激活自己的账号');
                  } else {
                    UserWechatProxy.updateUserInfo(open_id, user._id, user.student_id, function (err, wx) {
                      res.reply('欢迎您，' + user.name);
                    });
                  }
                } else {
                  res.reply('错误的账号或密码');
                }
              } else {
                res.reply('错误的账号或密码');
              }
            })
          } else {
            res.reply('错误的账号或密码');
          }
          return;
        }
        UserWechatProxy.getByOpenId(open_id, function (err, wx) {
          if (!wx) {
            res.reply('请先登录');
            return;
          }
          switch (content) {
            case 'logout':
              wx.user_id = null;
              wx.student_id = null;
              wx.save(function (err, wx) {
                res.reply('已登出');
              });
              break;
            //TODO: news, courseware
            default:
              res.reply('Unknown command');
              break;
          }
          return;
        });
        return;
        break;
    }
    res.reply('hehe');
  });
};