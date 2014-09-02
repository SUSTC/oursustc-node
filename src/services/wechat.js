
var EventProxy = require('eventproxy');
var request = require('request');

var util = require("./../common/util"),
    functions = require("./../common/functions"),
    string = require("./../common/string");

var config = require("./../config/config");

var wechat = require('wechat');
var proxy = require("./../proxy"),
    UserAccountProxy = proxy.UserAccount,
    UserWechatProxy = proxy.UserWechat,
    BoardProxy = proxy.Board,
    TopicProxy = proxy.Topic,
    UserPageRelationProxy = proxy.UserPageRelation,
    UserUrpProxy = proxy.UserUrp;

var NEWS_board_id = false;
BoardProxy.getBoardByShortcut('news', function (err, board) {
  if (err || !board) {
    NEWS_board_id = null;
    return;
  }
  NEWS_board_id = board._id;
});

function TopicToWXObject(topic, i) {
  var wxObject = {
    title: topic.title,
    //description: topic.author.name,
    url: 'https://sustc.us/topic/' + topic._id
  };
  var picp1 = /!\[image\]\((http.+?)\)/gi;
  var picp2 = /<img\s+?[^>]*?\s*?src="(http.+?)"/gi;
  var mpic = picp1.exec(topic.content);
  if (!mpic) {
    mpic = picp2.exec(topic.content);
  }
  var u = topic.author;
  if (mpic) {
    wxObject.picurl = mpic[1];
  } else {
    var picurl = '';
    if (i == 0) {
      if (u.front_cover_url) {
        picurl = 'https://sustc.us' + u.front_cover_url;
      } else {
        picurl = 'https://sustc.us/static/img/user/def-front-cover.jpg';
      }
    } else {
      if (u.avatar_url) {
        picurl = 'https://sustc.us' + u.avatar_url;
      } else {
        picurl = 'https://sustc.us/static/img/user/def-avatar.png';
      }
    }
    wxObject.picurl = picurl;
  }
  return wxObject;
}

function TranslateGPA(score) {
  var trans = [4, 4, 3.99, 3.98, 3.97, 3.95, 3.93, 3.91, 3.88,
   3.85, 3.81, 3.77, 3.73, 3.68, 3.63, 3.58, 3.52, 3.46, 
   3.39, 3.32, 3.25, 3.17, 3.09, 3.01, 2.92, 2.83, 2.73,
    2.63, 2.53, 2.42, 2.31, 2.2, 2.08, 1.96, 1.83, 1.7, 
    1.57, 1.43, 1.29, 1.15, 1, 0];
  return ((score >= 60) ? trans[(100 - Math.floor(score))] : 0);
};

function CalcGPA(terms) {
  var total = 0.0,
    n = 0.0;
  for (var i = 0; i < terms.length; i++) {
    for (var j = 0; j < terms[i].courses.length; j++) {
      var cls = terms[i].courses[j];
      total += TranslateGPA(cls.grade) * cls.credit;
      n += cls.credit;
    }
  }
  return (total / n).toFixed(2);
}

exports.getAccessToken = function (code, callback) {
  var url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
    + '?appid=' + config.WX_APPID
    + '&secret=' + config.WX_APPSECRET
    + '&code=' + code
    + '&grant_type=authorization_code';

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try {
        var token = JSON.parse(body);
        callback(null, token);
      } catch (e) {
        callback(e);
      }
    } else {
      callback(error);
    }
  });
};

exports.updateUserInfo = function (open_id, user_id, student_id, callback) {
  UserWechatProxy.getByOpenId(open_id, function (err, wx) {
    if (wx) {
      UserWechatProxy.updateUserInfo(open_id, user_id, student_id, callback);
    } else {
      UserWechatProxy.newAndSave(open_id, function (err, wx) {
        UserWechatProxy.updateUserInfo(open_id, user_id, student_id, callback);
      });
    }
  });
};

exports.Middleware = function () {
  return wechat(config.WX_TOKEN, function (req, res, next) {
    var message = req.weixin;
    var open_id = message.FromUserName;

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
                  + '登录账号后就可以收到我们最新动态，可以输入login来登录自己的账号。\n'
                  + '输入help查看帮助。\n');
              });
            } else {
              var rtext = '欢迎继续订阅南科大信息平台。\n'
                  + '\n'
                  + '请先在我们的网站上激活自己的账号 https://sustc.us\n'
                  + '默认的账号和密码都是学号。\n'
                  + '\n'
                  + '登录账号后就可以收到我们最新动态，可以输入login来登录自己的账号。\n'
                  + '输入help查看帮助。\n';
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
        switch (content) {
          case 'help':
            //TODO
            res.reply('南科大信息平台指令帮助\n'
              + 'help\t\t指令帮助\n'
              + 'login\t\t登录\n'
              + 'logout\t\t退出登录\n'
              + 'news\t\t新闻\n'
              + 'gpa \t\t总GPA\n'
              + 'score\t\t上学期成绩\n'
              + 'score all\t所有成绩\n');
            return;
            break;
          case 'login':
            res.reply([
              {
                title: '登录',
                description: '点击登录',
                //picurl: 'https://sustc.us/static/img/favicon-round.png',
                url: 'https://open.weixin.qq.com/connect/oauth2/authorize'
                          + '?appid=' + config.WX_APPID
                          + '&redirect_uri=' + 'https://sustc.us/user/login'
                          + '&response_type=code'
                          + '&scope=snsapi_userinfo'
                          + '&state=wechatconnect#wechat_redirect'
              }
            ]);
            return;
            break;
        }
        var m = content.match(/login (\S+?):(.+?)$/);
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
          //console.log(open_id, err, wx);
          if (!wx) {
            res.reply('请先登录');
            return;
          }
          switch (content) {
            case 'logout':
              wx.user_id = null;
              wx.student_id = null;
              wx.subscribe = false;
              wx.save(function (err, wx) {
                res.reply('已登出');
              });
              break;
            case 'news':
              var options = { limit: 5, sort: [ [ 'create_at', 'desc' ] ]};
              var query = { board_id: NEWS_board_id };
              TopicProxy.getTopicsByQuery(query, options, function (err, topics) {
                var contents = [];
                for (var i = 0; i < topics.length; i++) {
                  contents.push(TopicToWXObject(topics[i], i));
                }
                res.reply(contents);
              });
              break;
            case 'score':
            case 'score all':
            case 'gpa':
              var urperrmsg = '请先在网站上的用户页面中绑定学校的URP综合教务系统账号，并在绑定后更新信息。\nhttps://sustc.us/user/urp\n';
              UserPageRelationProxy.getPages(wx.user_id, function (err, rs) {
                if (rs && rs.length > 0) {
                  var page_id = rs[0].page_id;
                  UserUrpProxy.getUrpByUserId(page_id, function (err, urp) {
                    var terms = urp.terms;
                    if (terms && terms.length > 0) {
                      if (content == 'score all') {
                        var text = '';
                        for (var i = 0; i < terms.length; i++) {
                          text += terms[i].name + '\n';
                          for (var j = 0; j < terms[i].courses.length; j++) {
                            var course = terms[i].courses[j];
                            text += course.name + ': ' + course.grade + '\n';
                          }
                          text += '\n';
                        }
                        res.reply(text);
                      } else if (content == 'score') {
                        var last_term = terms[terms.length - 1];
                        var text = last_term.name + '\n\n';
                        for (var j in last_term.courses) {
                          var course = last_term.courses[j];
                          text += course.name + ': ' + course.grade + '\n';
                        }
                        res.reply(text);
                      } else if (content == 'gpa') {
                        res.reply('总GPA为' + CalcGPA(terms));
                      }
                    } else {
                      res.reply('没有获取成绩信息，不知在网站上点更新信息了吗？');
                    }
                  });
                } else {
                  res.reply(urperrmsg);
                }
              });
              return;
              break;
            default:
              BoardProxy.getBoardByName(content, function (err, board) {
                if (!board) {
                  res.reply('Unknown command');
                  return;
                }
                var options = { limit: 8, sort: [
                  ['top', 'desc'],
                  ['last_reply_at', 'desc']
                ]};
                var query = { board_id: board._id };
                TopicProxy.getTopicsByQuery(query, options, function (err, topics) {
                  var contents = [];
                  for (var i = 0; i < topics.length; i++) {
                    contents.push(TopicToWXObject(topics[i], i));
                  }
                  res.reply(contents);
                });
              });
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