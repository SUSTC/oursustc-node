
(function() {

  var EventProxy = require('eventproxy');

  //table = require("./../base/table");
  var config = require('./../config/config.json');
  var functions = require("./../common/functions"),
    string = require("./../common/string"),
    view = require("./../common/view"),
    constdata = require("./../common/constdata"),
    url = require('url'),
    proxy = require("./../proxy"),
    UserAccountProxy = proxy.UserAccount,
    UserPageProxy = proxy.UserPage,
    UserPageRelationProxy = proxy.UserPageRelation,
    UserUrpProxy = proxy.UserUrp;
  var URPSystem = require("./../class/urp").URPSystem;
  var Wechat = require("./../services/wechat");

  var MIN_PASSWORD_LENGTH = constdata.MIN_PASSWORD_LENGTH;

  function get_title(name, res) {
    return name + ' - ' + res.locals.core.lang.title.user.index;
  }

  exports.csrf = function(req, res, data, callback) {
    callback(true, {
      islogin: (res.locals.core.isLogin() ? 1 : 0),
      csrf: res.locals.core.user.csrf
    });
  };

  exports.checklogin = function(req, res, data, callback) {
    var resdata = {};
    if (res.locals.core.isLogin()) {
      var _user = res.locals.core.user;
      resdata.islogin = true;
      resdata.csrf = res.locals.core.user.csrf;
      resdata.user = {
        uid: _user.uid,
        studentid: _user.account.student_id,
        showname: _user.showname,
        'realname': _user.account.name,
        'email': _user.account.email,
      };
    } else {
      resdata.islogin = false;
    }

    callback(true, resdata);
  };

  exports.update = function(req, res, data, callback) {
    var resdata = {
      err: {
        no: 0
      }
    };
    if (req.query.key === config.API_KEY) {
      var info = req.body;
      UserAccountProxy.getUserByStudentId(info.studentid, function (err, user) {
        user.update_at = Date.now();
        if (!string.is_numeric(info.username)) {
          //设置登录名
          user.loginname = info.username;
          user.loginname_clean = string.clean(info.username);
        }
        user.password = info.password;
        user.email = info.email;
        user.activate = true;
        user.save(function (err, u) {
          if (err) {
            resdata.err.no = 2;
          } else {
            resdata.account = u;
          }
          callback(true, resdata);
        });
      });
      return;
    } else {
      resdata.err.no = 1;
    }
    callback(true, resdata);
  };

  exports.index = function(req, res, data, callback) {
    if (res.locals.core.isLogin()) {
      data.active = 'user';

      //data.page
      if (string.is_objectid(req.params.id)) {
        UserPageProxy.getUserById(req.params.id, function (err, page) {
          if (!err && page) {
            data.page = page;
            data.title = get_title(data.page.name, res);
            callback();
          } else {
            view.showMessage(data, res.locals.core.lang.errmsg.user_not_found, 'error', callback);
          }
        });
      } else {
        if (res.locals.core.api) {
          res.locals.core.user.renderData(data);
        }
        data.page = res.locals.core.user.page;
        data.title = get_title(data.page.name, res);
        callback();
      }

    } else {
      res.redirect('/user/login');
      callback(true);
    }
  };

  exports.activity = exports.index;

  exports.page = function(req, res, data, callback) {

    if (res.locals.core.isLogin()) {

      if (req.params.id === 'switch') {
        if (req.query.csrf === res.locals.core.user.csrf) {
          res.locals.core.user.switchpage(req.query.page_id, res);
        }
        res.redirect('/user/page');
        callback(true);
      } else if (req.method == 'POST') {

        if (req.body.csrf === res.locals.core.user.csrf) {

          var check_info = (req.body && req.body.user_page);

          if (check_info) {
            var user_page = req.body.user_page;

            if (req.params.id === 'create') {
              var page_new = {};

              var username_clean = string.clean(String(user_page.name));
              if (username_clean) {

                page_new.name = user_page.name;
                if (user_page.bio) {
                  page_new.bio = user_page.bio;
                } else {
                  page_new.bio = '';
                }

                UserPageProxy.getUserByNameClean(username_clean, function (err, page) {
                  if (!err && page) {
                    //have same name page
                    view.showMessage(data, res.locals.core.lang.user.input_error.page_already_exists,
                        'error', '/user/page', callback);
                    return;
                  }
                  UserPageProxy.newAndSave(
                    res.locals.core.user.uid, 3,
                    true, //noaccount
                    page_new.name,
                    page_new.bio,
                    '', '',
                    function (err, page, r) {
                      //console.log(err, page, r);
                      res.redirect('/user/page');
                      callback(true);
                    }
                  );
                });
                return;
              }
            } else if (req.params.id === 'manage' && res.locals.core.user.inpage) {
              if (req.body.action === 'add') {
                if (user_page.studentid && string.is_numeric(user_page.studentid)) {
                  res.redirect('/user/page');
                  UserAccountProxy.getUserByStudentId(user_page.studentid, function (err, user) {
                    if (user && res.locals.core.user.page.power >= 2 && user.uid != res.locals.core.user.uid) {
                      // check exist
                      var ipower = user_page.set_manager ? 3 : 1;
                      UserPageRelationProxy.getRelation(user.uid, res.locals.core.user.page_id, function (err, r) {
                        if (r) {
                          if (r.power != ipower) {
                            r.power = ipower;
                            r.save();
                          }
                          callback(true);
                          //table_user_page_permission.update(permission_rows[0].permission_id, {level: 1}, value);
                        } else {
                          UserPageRelationProxy.newAndSave(user.uid, res.locals.core.user.page_id, ipower, function (err, r2) {
                            callback(true);
                          });
                        }
                      });
                    } else {
                      callback(true);
                    }
                  });
                  return;
                }
              }
            }

          }
        }

        res.redirect('/user/page');
        callback(true);
      } else if (req.method == 'GET' && req.params.id === 'manage') {
        //get
        if (req.query.csrf === res.locals.core.user.csrf) {
          if (req.query.action === 'remove') {
            if (req.query.uid) {
              if (res.locals.core.user.inpage && res.locals.core.user.page.power >= 2 && string.is_objectid(req.query.uid)) {
                var page_manager = res.locals.core.user.page_manager;
                var check_page_manager = false;
                for (var i = 0; i < page_manager.length; i++) {
                  if (page_manager[i].uid === req.query.uid) {
                    check_page_manager = true;
                    break;
                  }
                }
                if (check_page_manager) {
                  UserPageRelationProxy.remove(req.query.uid, res.locals.core.user.page_id, function (err) {
                    res.redirect('/user/page');
                    callback(true);
                  });
                  return;
                }
              }
            } else if (req.query.page_id) {
              if (string.is_objectid(req.query.page_id)) {
                var page_manager = res.locals.core.user.page_list;
                var check_page_manager = false;
                var page_id = req.query.page_id;
                for (var i = 0; i < page_manager.length; i++) {
                  if (page_manager[i]._id.toString() === page_id) {
                    check_page_manager = true;
                    break;
                  }
                }
                if (check_page_manager) {
                  UserPageRelationProxy.remove(res.locals.core.user.uid, page_id, function (err) {
                    res.redirect('/user/page');
                    callback(true);
                  });
                  return;
                }
              }
            }
          }
        }
        res.redirect('/user/page');
        callback(true);
      } else {

        data.active = 'user';
        data.page = res.locals.core.user.page;
        data.title = get_title(data.page.name, res);
        //res.locals.core.user.show_all_resource();

        callback();
      }

    } else {
      res.redirect('/user/login?url=/user/page');
      callback(true);
    }
  };

  function login_callback(is_login, errdata, req, res, data, callback) {
    var redirectUrl = '';
    if (req.query.url) {
      redirectUrl = req.query.url;
    } else if (req.body.url) {
      redirectUrl = req.body.url;
    } else if (req.headers.referer) {
      var urlQuery = url.parse(req.headers.referer, true).query;
      if (urlQuery.url) {
        redirectUrl = urlQuery.url;
      }
    }
    if (!is_login) {
      data.title = res.locals.core.lang.title.user.login;
      
      if (errdata.password) {
        errdata.msg = res.locals.core.lang.errmsg.invalid_password;
      } else if (errdata.accountid) {
        errdata.msg = res.locals.core.lang.errmsg.invalid_account;
      }
      data.err = errdata;

      data.active = 'user';
      data.redirect = redirectUrl;
      callback();
    } else {
      if (!redirectUrl) {
        redirectUrl = '/user';
      }
      if (res.locals.core.api) {
        data.islogin = 1;
        data.cookies = res.locals.core.user.cookies;
      } else {
        res.redirect(redirectUrl);
      }
      callback(true);
    }
  }

  exports.signin = function(req, res, data, callback) {
    var redirectUrl = '/user/login';
    if (req.query.url) {
      redirectUrl += '?url=' + req.query.url;
    } else if (req.query.redirect) {
      redirectUrl += '?url=' + req.query.redirect;
    }
    
    res.redirect(redirectUrl);
    callback(true);
  };

  exports.login = function(req, res, data, callback) {

    var errdata = {};
    var is_login = res.locals.core.isLogin();
    var check_login_info = ((req.method == 'POST') && req.body && req.body.user);

    data.wx_openid = '';
    if (check_login_info) {
      if (req.body.wx_openid) {
        data.wx_openid = req.body.wx_openid;
      }

      if (!req.body.user.account_id) {
        errdata.accountid = true;
      } else if (!req.body.user.password) {
        errdata.password = true;
      } else {
        res.locals.core.user.login(
          req.body.user.account_id,
          req.body.user.password,
          req.body.remember_me,
          res,
          function (err, user, goactivate) {
            if (err) {
              errdata = err;
            } else {
              is_login = true;
            }
            if (goactivate) {
              data.err = errdata;
              data.goactivate = true;
              callback(true);
            } else {
              if (is_login && data.wx_openid) {
                Wechat.updateUserInfo(data.wx_openid, user._id, user.student_id, function (err, wx) {
                  view.showMessage(data, res.locals.core.lang.wechat.bind_success, 'success',
                    "javascript:WeixinJSBridge.invoke('closeWindow',{},function(res){});", callback);
                });
                return;
              }
              login_callback(is_login, errdata, req, res, data, callback);
            }
          }
        );
      }
    } else {
      if (req.query.state === 'wechatconnect' && req.query.code) {
        Wechat.getAccessToken(req.query.code, function (err, token) {
          if (token && token.openid) {
            data.wx_openid = token.openid;
            is_login = false;
          }
          login_callback(is_login, errdata, req, res, data, callback);
        });
      } else {
        login_callback(is_login, errdata, req, res, data, callback);
      }
    }
  };

  exports.logout = function(req, res, data, callback) {
    // check csrf
    if (req.query.csrf === res.locals.core.user.csrf) {
      res.locals.core.user.clearcookie(res);
    }
    res.redirect('/');
    callback(true);
  };

  exports.forgot = function(req, res, data, callback) {
    data.title = res.locals.core.lang.title.user.forgot;
    data.active = 'user';
    callback();
  };

  exports.activate = function(req, res, data, callback) {
    data.title = res.locals.core.lang.title.user.activate;
    data.active = 'user';
    data.err = {};
    var key = null;
    if (req.method == 'POST') {
      key = req.body.key;
      var account = {};
      if (req.body.key && req.body.user) {
        if (req.body.user.new_password && req.body.user.new_password.length > 0) {
          if (req.body.user.new_password === req.body.user.new_password_again && req.body.user.new_password.length >= MIN_PASSWORD_LENGTH) {
            account.password = functions.password_hash(req.body.user.new_password);
          } else {
            data.err.new_password = true;
          }
        }
        if (req.body.user.email && functions.email_check(req.body.user.email)) {
          account.email = req.body.user.email;
        } else {
          data.err.email = true;
        }
      }
      if (functions.is_object_empty(data.err)) {
        if (key && !functions.is_object_empty(account)) {
          res.locals.core.user.activate(res, key, account, function (err, user) {
            if (!err && user) {
              view.showMessage(data, res.locals.core.lang.errmsg.activate_succeed, 'success', '/user/login', callback);
            } else {
              view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', callback);
            }
          });
        } else {
          view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', callback);
        }
        return;
      }
    } else {
      key = req.query.key;
    }
    {
      // normal
      if (!key) {
        view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', callback);
        return;
      } else {
        res.locals.core.user.getactivateparams(key, function (err, user) {
          if (user) {
            data.activate = {
              key: key,
              user: user
            };
            callback();
          } else {
            view.showMessage(data, res.locals.core.lang.errmsg.user_not_found, 'error', callback);
          }
        });
      }
    }
    
  };

  exports.urp = function(req, res, data, callback) {
    if (res.locals.core.isLogin()) {
      //limit
      if (res.locals.core.user.page.flags != 0) {
        res.redirect('/user/page');
        callback(true);
        return;
      }

      data.err = {};
      var check_config_info = ((req.method == 'POST') && req.body);

      var events = ['urp', 'opurp'];
      var ep = EventProxy.create(events, function (urp, opurp) {

        if (!check_config_info && req.params.id) {
          if (!urp) {
            callback(true, {err: 'urp_need_update'});
            return;
          }
          var cb = {};
          switch (req.params.id) {
            case 'info':
              cb = urp.info;
              break;
            case 'courses':
              cb = urp.courses;
              break;
            case 'terms':
              cb = urp.terms;
              break;
          }
          callback(true, cb);
          return;
        }

        data.active = 'user';
        data.page = res.locals.core.user.page;
        
        data.title = get_title(data.page.name, res);

        if (opurp === false) {
          // do remove
          data.urp = null;
        } else if (check_config_info && opurp) {
          data.urp = opurp;
        } else {
          data.urp = urp;
        }

        if (data.urp) {
          data.urp.password = undefined;
          data.urp.cookie = undefined;
        }
        
        if (data.urp) {
          data.urp.update_at_friendly = string.format_date(data.urp.update_at, true);
        }

        callback();
      });

      UserUrpProxy.getUrpByUserId(res.locals.core.user.page_id, function (err, urp) {

        ep.emit('urp', urp);

        if (check_config_info) {
          if (req.body.csrf !== res.locals.core.user.csrf) {
            data.err.msg = res.locals.core.lang.errmsg.invalid_submit;
            ep.emit('opurp', null);
          } else {
            var urpsys = new URPSystem();
            switch (req.body.op) {
              case 'bind':
                if (req.body.user && req.body.user.urp_username && req.body.user.urp_password) {
                  var surp = {
                    username: req.body.user.urp_username,
                    password: req.body.user.urp_password
                  };
                  
                  urpsys.login(surp.username, surp.password, function (err) {
                    if (err) {
                      //urpsys.cookie;
                      data.err.msg = err;
                      ep.emit('opurp', null);
                    } else {
                      if (!urp) {
                        UserUrpProxy.newAndSave(res.locals.core.user.page_id,
                          surp.username, surp.password, urpsys.cookie, ep.done('opurp'));
                      } else {
                        urp.flags = 0;
                        urp.username = surp.username;
                        urp.password = surp.password;
                        urp.cookie = urpsys.cookie;
                        urp.info = null;
                        urp.terms = null;
                        urp.courses = null;
                        urp.update_at = Date.now();
                        urp.save(ep.done('opurp'));
                      }
                    }
                  });
                  return;
                } else {
                  data.err.msg = res.locals.core.lang.errmsg.invalid_submit;
                }
                break;
              case 'update':
                if (urp) {
                  urpsys.login(urp.username, urp.password, function (err) {
                    if (err) {
                      data.err.op = {
                        msg: err
                      };
                      ep.emit('opurp', null);
                    } else {
                      var urp_events = ['cleargroups', 'info', 'terms', 'courses'];
                      var urp_ep = EventProxy.create(urp_events, function (cleargroups, info, terms, courses) {
                        if (info) {
                          urp.flags = 1;
                        }
                        urp.cookie = urpsys.cookie;
                        urp.info = info;
                        urp.terms = terms;
                        urp.courses = courses;
                        urp.update_at = Date.now();
                        urp.save(function (err, urp2) {
                          res.locals.core.user.create_group_by_urp(urp2, function () {
                            ep.emit('opurp', urp2);
                          });
                        });
                      });
                      res.locals.core.user.clear_urp_group(urp_ep.done('cleargroups'));
                      urpsys.getInfo(urp_ep.done('info'));
                      urpsys.getTerms(urp_ep.done('terms'));
                      urpsys.getCourses(urp_ep.done('courses'));
                    }
                  });
                  return;
                } else {
                  data.err.op = {
                    msg: res.locals.core.lang.errmsg.invalid_submit
                  };
                  //data.err.msg = res.locals.core.lang.errmsg.invalid_submit;
                }
                break;
              case 'remove':
                if (urp) {
                  UserUrpProxy.removeByUserId(res.locals.core.user.page_id, function () {
                    //do remove
                    ep.emit('opurp', false);
                  });
                  return;
                }
                break;
            }
            ep.emit('opurp', null);
          }
        } else {
          ep.emit('opurp', null);
        }
      });
    } else {
      res.redirect('/user/login?url=/user/urp');
      callback(true);
    }
  };

  exports.settings = function(req, res, data, callback) {
    if (res.locals.core.isLogin()) {

      data.err = {};
      var check_config_info = ((req.method == 'POST') && req.body && req.body.user);

      if (check_config_info) {
        if (req.body.csrf !== res.locals.core.user.csrf) {
          data.err.msg = res.locals.core.lang.errmsg.invalid_submit;
        } else {

          var account_change = {};
          var page_change = {};

          var change_events = ['page', 'account'];
          var cep = EventProxy.create(change_events, function (page, account) {
            if (page) {
              for (var name in page_change) {
                res.locals.core.user.page[name] = page_change[name];
              }
              //change show name
              if (page_change.name) {
                res.locals.core.user.showname = page_change.name;
              }
              //res.locals.core.navpages[0].name = res.locals.core.user.showname;

              data.err.success = true;
            }

            if (account) {
              for (var name in account_change) {
                res.locals.core.user.account[name] = account_change[name];
              }
              data.err.success = true;
            }

            data.active = 'user';
            data.page = res.locals.core.user.page;
            data.title = get_title(data.page.name, res);
            callback();
          });

          var events = ['avatar', 'cover', 'username', 'finish'];
          var ep = EventProxy.create(events, function (avatar, cover, finish) {
            if (!functions.is_object_empty(account_change)) {
              //table_user_account.update(res.locals.core.user.uid, account_change);
              UserAccountProxy.updateById(res.locals.core.user.uid, account_change, cep.done('account'));
            } else {
              cep.emit('account', null);
            }
            if (!functions.is_object_empty(page_change)) {
              //table_user_page.update(res.locals.core.user.page_id, page_change);
              UserPageProxy.updateById(res.locals.core.user.page_id, page_change, cep.done('page'));
            } else {
              cep.emit('page', null);
            }
          });

          //password
          if (req.body.user.password) {
            if (functions.password_check_hash(req.body.user.password, res.locals.core.user.account.password)) {
              //check security change
              if (req.body.user.new_password && req.body.user.new_password.length > 0) {
                if (req.body.user.new_password === req.body.user.new_password_again && req.body.user.new_password.length >= MIN_PASSWORD_LENGTH) {
                  account_change.password = functions.password_hash(req.body.user.new_password);
                } else {
                  data.err.new_password = true;
                }
              }
              if (req.body.user.email !== res.locals.core.user.account.email) {
                if (!req.body.user.email || functions.email_check(req.body.user.email)) {
                  account_change.email = req.body.user.email;
                } else {
                  data.err.email = true;
                }
              }
            } else {
              data.err.password = true;
            }
          }

          /* if (res.locals.core.user.page.noaccount) */ {
            var userQuery = false;
            if (req.body.user.username !== res.locals.core.user.page.name) {
              //check username is used
              var username_clean = string.clean(req.body.user.username);
              if (!username_clean) {
                //do not thing
                //data.err.username = true;
              } else if (username_clean !== res.locals.core.user.page.name_clean) {
                userQuery = true;
                //var u = table_user_account.query_by_username(username_clean); if (u && u[0]) {
                UserPageProxy.getUserByNameClean(username_clean, function (err, page) {
                  if (page) {
                    data.err.username = true;
                  } else {
                    page_change.name = req.body.user.username;
                    page_change.name_clean = username_clean;
                  }
                  ep.emit('username', true);
                });
              }
            }
            if (!userQuery) {
              ep.emit('username', false);
            }
          }

          if (req.body.user.contact) {
            if (req.body.user.contact !== res.locals.core.user.page.contact) {
              //if (string.is_numeric(req.body.user.contact)) {
              if (req.body.user.contact.length < 50) {
                page_change.contact = req.body.user.contact;
              } else {
                data.err.contact = true;
              }
            }
          }

          /* if (req.body.user.bio) */ {
            if (req.body.user.bio !== res.locals.core.user.page.bio) {
              if (req.body.user.bio.length < 1000) {
                page_change.bio = req.body.user.bio;
              }
            }
          }

          if (req.files && req.files.user) {
            if (req.files.user.avatar_file && req.files.user.avatar_file.size > 0) {
              res.locals.core.resource.add(req.files.user.avatar_file, false, function (err, content, path) {
                if (content) {
                  page_change.avatar = content.path;
                } else {
                  data.err.avatar_file = true;
                }
                ep.emit('avatar', true);
              });
            } else {
              ep.emit('avatar', false);
            }
            if (req.files.user.front_cover_file && req.files.user.front_cover_file.size > 0) {
              res.locals.core.resource.add(req.files.user.front_cover_file, false, function (err, content, path) {
                if (content) {
                  page_change.cover = content.path;
                } else {
                  data.err.front_cover_file = true;
                }
                ep.emit('cover', content);
              });
            } else {
              ep.emit('cover', false);
            }
          } else {
            ep.emit('avatar', false);
            ep.emit('cover', false);
          }

          ep.emit('finish', true);
          return;
        }
      }

      data.active = 'user';
      data.page = res.locals.core.user.page;
      data.title = get_title(data.page.name, res);
      
      callback();
    } else {
      res.redirect('/user/login?url=/user/settings');
      callback(true);
    }
  };

}).call(this);
