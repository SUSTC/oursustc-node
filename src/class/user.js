
(function() {

  var EventProxy = require('eventproxy');
  var util = require("./../common/util"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    constdata = require("./../common/constdata"),
    model = require("./../model"),
    proxy = require("./../proxy"),
    config = require("./../config/config.json"),
    crypto = require("crypto"),
    UserAccountProxy = proxy.UserAccount,
    UserPageProxy = proxy.UserPage,
    UserPageRelationProxy = proxy.UserPageRelation,
    NotificationProxy = proxy.Notification;

  var max_online_time = 2592000000; // a month
  var HTTP_ONLY = true;

  function User(core) {
    this.account = {};
    this.page = {};
    this.page_list = [];
    this.page_manager = [];
    this.page_user = [];
    this.is_page_manger = false;
    this.showname = '';

    this.uid = 0;
    this.page_id = 0;

    this.inpage = false;
    this.csrf = '';
    this.showbalance_ = false;

    this.core = core;
  }

  User.prototype.init = function() {
    /* UserAccountProxy.newAndSave(
      '11210000',
      '测试者', 0, 'test',
      functions.password_hash('123456'),
      'test@sustc.us',
      true, function (err, user) {
        console.log(err, user);
    }); */
    /* UserPageProxy.newAndSave(
      'teng',
      '测试用户页',
      '', '',
      function (err, page) {
        UserPageRelationProxy.newAndSave(
          "5288c70c924362901a000001", page._id, 3,
          function (err, r) {
            console.log(page, r);
        }); 
    }); */
    /* UserPageRelationProxy.newAndSave(
      "5288c70c924362901a000001", "5288d0cd12bc611815000001", 3,
      function (err, r) {
        console.log(r);
    }); */
  };
  
  User.prototype.isPageAccessible = function (page_id) {
    if (!this.page_list || this.page_list.length <= 0) {
      return false;
    }
    
    if (page_id && page_id.length === 24) {
      for (var i = 0; i < this.page_list.length; i++) {
        var page = this.page_list[i];
        if (page._id.toString() == page_id) {
          // check user is assistant teacher or not.
          return ((page.flags == 0 || ((page.flags == 1 || page.flags == 2) && page.power >= 3)));
        }
      }
    }
    
    return false;
  };

  User.prototype.setpage = function(page) {
  };

  User.prototype.show_all_resource = function() {
    var resource_ids = [];
    for (var i = 0; i < this.page_list.length; i++) {
      resource_ids.push(this.page_list[i].avatar_resource_id);
      resource_ids.push(this.page_list[i].front_cover_resource_id);
    }
    for (var i = 0; i < this.page_manager.length; i++) {
      resource_ids.push(this.page_manager[i].avatar_resource_id);
      resource_ids.push(this.page_manager[i].front_cover_resource_id);
    }
    //this.core.resource.parse(resource_ids);
  };

  User.prototype.renderData = function(data) {
    if (this.uid !== 0) {
      data.user = {
        'uid': this.account.uid,
        'student_id': this.account.student_id,
        
        'name': this.showname,
        'showname': this.showname,
        'realname': this.account.name,
        'email': this.account.email,

        'csrf': this.csrf,

        'inpage': this.inpage,
        'page_list': this.page_list,
        'page_manager': this.page_manager,
        'page_user': this.page_user,

        'is_page_manger': this.is_page_manger,

        'pagename': this.page.name,
        'avatar_url': this.page.avatar_url,
        'front_cover_url': this.page.front_cover_url,
        'new_notification': this.page.new_notification,

        'page': this.page,
        'page_id': this.page_id,
        'contact': this.page.contact,
        'bio': this.page.bio,
      };

      if (this.showbalance_) {
        data.user.balance = {
          'value': this.account.balance,
          'str': string.price_format(this.account.balance)
        };
      }

      if (this.page.avatar_resource_id > 0) {
        this.core.resource.parse(this.page.avatar_resource_id);
      }
      if (this.page.front_cover_resource_id > 0) {
        this.core.resource.parse(this.page.front_cover_resource_id);
      }
    } else {
      data.user = {
        'uid': 0,
        'page_id': 0,
        'page': {}
      };
    }
  };

  User.prototype.showbalance = function() {
    this.showbalance_ = true;
  };

  User.prototype.getusercsrf = function(cookiekey) {
    var csrfbase = string.md5(cookiekey);
    return csrfbase.substr(2, 16);
  };

  User.prototype.checkcsrf = function(csrf) {
    if (this.uid) {
      return (csrf === this.csrf);
    } else {
      return false;
    }
  };

  User.prototype.switchpage = function(page_id, res) {
    page_id = page_id.replace(/[^0-9a-z]/g, '');
    if (this.isPageAccessible(page_id)) {
      var TIMESTAMP = this.core.TIMESTAMP;
      var cookie_options = { httpOnly: HTTP_ONLY };
      cookie_options.expires = new Date(TIMESTAMP + max_online_time);
      res.cookie(config.COOKIE_PREFIX + 'page_id', page_id.toString(), cookie_options);
      return true;
    }
    return false;
  };

  User.prototype.updatecookie = function(uid, remember_me, res) {
    var cookiekey = string.random(36);
    //no save cookiekey to db, to make multi login
    //table_user_account.update_cookiekey(uid, cookiekey);
    return this.setcookie(uid, cookiekey, remember_me, res);
  };

  User.prototype.getactivatekey = function(uid) {
    var TIMESTAMP = this.core.TIMESTAMP;
    var strUid = String(uid);

    var randomkey = string.random(4);

    while (strUid.length % 8 !== 0) {
      strUid = "0" + strUid;
    }

    var plaintext = new Buffer(parseInt(TIMESTAMP / 1000).toString() + "\n"
      + strUid + "\n"
      + randomkey); //make it (x % 8 = 0)

    var key = new Buffer(config.COOKIE_DES_KEY, 'hex');
    var iv = new Buffer(config.COOKIE_DES_IV, 'hex');
    var cipher = crypto.createCipheriv("des", key, iv);
    cipher.setAutoPadding(false);

    var c = cipher.update(plaintext, 'binary', 'hex');
    c += cipher.final('hex');

    return c;
  };

  User.prototype.getactivateparams = function(activeKey, callback) {
    var key = new Buffer(config.COOKIE_DES_KEY, 'hex');
    var iv = new Buffer(config.COOKIE_DES_IV, 'hex');
    var decipher = crypto.createDecipheriv("des", key, iv);
    decipher.setAutoPadding(false);
    var d;
    try {
      d = decipher.update(activeKey, 'hex', 'binary');
      d += decipher.final('binary');
    } catch (e) {
      callback(true);
    }
    
    if (!d) {
      callback(true);
    }

    var activeData = d.split("\n");
    if (activeData.length !== 3) {
      callback(true);
    }

    var activetime = parseInt(activeData[0]);
    var account_id = activeData[1];

    if (activetime && account_id && (this.core.TIMESTAMP - (activetime * 1000)) < max_online_time) {
      UserAccountProxy.getUserById(account_id, function (err, user) {
        if (err) {
          callback(err);
          return;
        }
        if (user && !user.activate) {
          callback(null, user);
        } else {
          callback(true);
        }
      });
    } else {
      callback(true);
    }
  };
  

  User.prototype.setcookie = function(uid, cookiekey, remember_me, res) {
    //TIMESTAMP 毫秒数
    //expires: new Date(TIMESTAMP + max_online_time)
    //maxAge: 9000
    var TIMESTAMP = this.core.TIMESTAMP;
    var strUid = String(uid);

    while (strUid.length % 8 !== 0) {
      strUid = "0" + strUid;
    }

    var plaintext = new Buffer(parseInt(TIMESTAMP / 1000).toString() + "\n"
      + strUid + "\n"
      + cookiekey);

    var key = new Buffer(config.COOKIE_DES_KEY, 'hex');
    var iv = new Buffer(config.COOKIE_DES_IV, 'hex');
    var cipher = crypto.createCipheriv("des", key, iv);
    cipher.setAutoPadding(false);

    var c = cipher.update(plaintext, 'binary', 'hex');
    c += cipher.final('hex');

    var cookie_options = { httpOnly: HTTP_ONLY };
    if (remember_me) {
      cookie_options.expires = new Date(TIMESTAMP + max_online_time);
    }
    this.cookies = config.COOKIE_PREFIX + 'user=' + c;
    res.cookie(config.COOKIE_PREFIX + 'user', c, cookie_options);
    res.clearCookie(config.COOKIE_PREFIX + 'page_id');
  };

  User.prototype.clearcookie = function(res) {
    res.clearCookie(config.COOKIE_PREFIX + 'user');
    res.clearCookie(config.COOKIE_PREFIX + 'page_id');
  };

  User.prototype.activate = function(res, key, account, callback) {
    this.getactivateparams(key, function (err, user) {
      if (err || !user) {
        callback(err);
        return;
      }
      user.password = account.password;
      user.email = account.email;
      user.activate = true;
      user.save(callback);
    });
  };

  User.prototype.login = function(studentId, password, remember_me, res, callback) {
    var getFunc = UserAccountProxy.getUserByStudentId;
    if (!string.is_numeric(studentId)) {
      //非学号
      getFunc = UserAccountProxy.getUserByLoginName;
    }
    getFunc(studentId, function (err, user) {
      var errdata = {};
      var is_login = false;
      if (err || !user) {
        errdata.accountid = true;
      } else {
        if (functions.password_check_hash(password, user.password)) {
          if (user.activate) {
            is_login = true;
            res.locals.core.user.updatecookie(user.uid, remember_me, res);
          } else {
            if (!res.locals.core.api) {
              var activateUrl = '/user/activate?key=' + res.locals.core.user.getactivatekey(user.uid);
              res.redirect(activateUrl);
            }
            errdata.activate = true;
            callback(errdata, user, true);
            return;
          }
        } else {
          errdata.password = true;
        }
      }
      callback(is_login ? undefined : errdata, user);
    });
  };

  User.prototype.getNotification = function(callback) {
    var that = this;
    NotificationProxy.getMessagesCount(this.page_id, function (err, count) {
      if (err) {
        callback(err);
      } else {
        that.page.new_notification = count;
        callback(null, count);
      }
    });
  };

  User.prototype.checklogin = function(cookie, req, callback) {
    if (req.query && req.query.cookies) {
      var _cookies = req.query.cookies;
      var arrcookie = _cookies.split(';');
      var _cookie = {};
      for (var i = 0; i < arrcookie.length; i++) {
        var se = arrcookie[i].split('=');
        if (se.length === 2) {
          var sname = string.trim(se[0]);
          if (sname) {
            _cookie[sname] = unescape(se[1]);
          }
        }
      }
      cookie = _cookie;
    }
    var usercookie = cookie[config.COOKIE_PREFIX + 'user'];
    if (usercookie && (usercookie.length % 8) === 0) {

      var key = new Buffer(config.COOKIE_DES_KEY, 'hex');
      var iv = new Buffer(config.COOKIE_DES_IV, 'hex');
      var decipher = crypto.createDecipheriv("des", key, iv);
      decipher.setAutoPadding(false);
      var d;
      try {
        d = decipher.update(usercookie, 'hex', 'binary');
        d += decipher.final('binary');
      } catch (e) {
        callback(false);
      }
      
      if (!d) {
        callback(false);
      }

      var cookieData = d.split("\n");
      if (cookieData.length !== 3) {
        callback(false);
      }

      var cookietime = parseInt(cookieData[0]);
      var account_id = cookieData[1];
      var cookiekey = cookieData[2];
      
      if (cookietime && account_id && cookiekey && (this.core.TIMESTAMP - (cookietime * 1000)) < max_online_time) {
        var that = this;

        var user_page_id = cookie[config.COOKIE_PREFIX + 'page_id'];

        var eventms = ['login', 'user_page_manager', 'manager_default_page'];
        var epm = EventProxy.create(eventms, function (login, userPageManagers, ManagerPages) {
          if (userPageManagers) {
            //获得默认的头像和封面
            for (var i = 0; i < userPageManagers.length; i++) {
              for (var j = 0; j < ManagerPages.length; j++) {
                if (userPageManagers[i].uid == ManagerPages[j].account_id) {
                  if (ManagerPages[j].front_cover_url) {
                    userPageManagers[i].front_cover_url = ManagerPages[j].front_cover_url;
                  }
                  if (ManagerPages[j].avatar_url) {
                    userPageManagers[i].avatar_url = ManagerPages[j].avatar_url;
                  }
                }
                break;
              }
              //password removed
            }
            that.page_manager = userPageManagers;
          }
          callback(login.is_login);
        });

        var events = ['user', 'user_page_relation', 'user_page'];
        var ep = EventProxy.create(events, function (user, userPageRelation, userPages) {
          var is_login = false;
          if (user) {
            is_login = true;

            that.account = user;
            that.accounttype = parseInt(user.accounttype);

            that.showname = user.name;
            that.uid = user.uid;
            that.csrf = that.getusercsrf(cookiekey);
            
            var page;
            if (userPages.length > 0) {
              for (var i = 0; i < userPages.length; i++) {
                for (var j = 0; j < userPageRelation.length; j++) {
                  if (userPages[i]._id.toString() == userPageRelation[j].page_id.toString()) {
                    userPages[i].power = userPageRelation[j].power;
                    userPages[i].uid = userPageRelation[j].account_id;
                  }
                }
              }
              
              that.page_list = userPages;
              if (that.isPageAccessible(user_page_id)) {
                for (var i = 0; i < userPages.length; i++) {
                  if (userPages[i]._id.toString() == user_page_id) {
                    page = userPages[i];
                    break;
                  }
                }
                if (!page) {
                  page = userPages[0];
                }
              } else {
                page = userPages[0];
              }
            } else {
              // no pages
              that.page_list = [];
            }

            if (page) {
              that.page_id = page._id.toString();
              that.page = page;

              that.getNotification(ep.done('notification_count'));

              if (page.name) {
                that.showname = page.name;
              }
              if (page.noaccount) {
                that.inpage = true;
              }
              if (page.power >= 2) {
                that.is_page_manger = true;
              }
            }

            ep.emit('user_current_page', page);
            is_login = true;
          } else {
            epm.emit('user_page_manager', null);
            epm.emit('manager_default_page', null);
          }

          epm.emit('login', { is_login: is_login });
        });

        ep.fail('error', function (err) {
          epm.unbind();
          callback(false);
        });

        epm.fail(function () {
          callback(false);
        });

        ep.all('user_current_page', 'notification_count', function (page) {
          if (page && page.noaccount && page.power >= 3) {
            //inpage
            UserPageRelationProxy.getRelationsByPageId(page._id, function (err, r) {
              var account_ids = [];
              for (var i = 0; i < r.length; i++) {
                /* if (user.uid != r[i].account_id) */ {
                  account_ids.push(r[i].account_id);
                }
              }
              if (account_ids.length > 0) {
                UserAccountProxy.getUsersByIds(account_ids, epm.done('user_page_manager'), true);
                UserPageProxy.getDefaultPages(account_ids, epm.done('manager_default_page'));
              } else {
                epm.emit('user_page_manager', null);
                epm.emit('manager_default_page', null);
              }
            });
          } else {
            epm.emit('user_page_manager', null);
            epm.emit('manager_default_page', null);
          }
        });

        UserPageRelationProxy.getPages(account_id, function (err, userPageRelation) {
          if (err) {
            return ep.emit('error', err);
          }
          ep.emit('user_page_relation', userPageRelation);

          var page_ids = [];
          for (var i = 0; i < userPageRelation.length; i++) {
            page_ids.push(userPageRelation[i].page_id);
          }

          if (page_ids.length > 0) {
            UserPageProxy.getUsersByIds(page_ids, ep.done('user_page'));
          } else {
            ep.emit('user_page', []);
          }
        });

        UserAccountProxy.getUserById(account_id, ep.done('user'));
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  };

  User.prototype.clear_urp_group = function (callback) {
    UserPageRelationProxy.urpRemove(this.uid, callback);
  };

  User.prototype.create_group_by_urp = function(urp, callback) {
    var uid = this.uid;
    var names = [];
    names.push(urp.info.class);
    names.push(urp.info.grade);
    for (var i = 0; i < urp.courses.length; i++) {
      var strno = (urp.courses[i].no < 10 ? '0' : '') + urp.courses[i].no.toString();
      names.push(urp.courses[i].name + ' ' + strno);
    }
    var ep = new EventProxy();
    ep.after('r', names.length, function (rs) {
      // 按顺序排列
      callback(true);
    });
    UserPageProxy.getUsersByNames(names, function (err, pages) {
      for (var i = 0; i < pages.length; i++) {
        var j = names.indexOf(pages[i].name);
        if (j !== -1) {
          names.splice(j, 1);
        }
        //insert user
        UserPageRelationProxy.urpNewAndSave(uid, pages[i]._id, ep.group('r'));
      }
      for (var i = 0; i < names.length; i++) {
        //create
        //insert user
        UserPageProxy.urpNewAndSave(names[i], (i < 2 ? 1 : 2), function (err, page) {
          if (err || !page) {
            ep.emit('r', null);
          } else {
            UserPageRelationProxy.urpNewAndSave(uid, page._id, ep.group('r'));
          }
        });
      }
    });
  };

  function install_user_single(filename, callback) {
    var count = 0, startStudentId = 0;
    var accounts = [];
    util.lineSplit('src/data/' + filename + '.csv', function(line) {
      var userdata = line.split(',');
      if (userdata && userdata.length >= 2) {
        var studentid_ = parseInt(userdata[0]);
        if (userdata[1] && studentid_ > 0) {
          if (startStudentId === 0) {
            startStudentId = studentid_;
          }

          var objuser = {
            studentId: studentid_,
            name: userdata[1],
            password: functions.password_hash(studentid_.toString()),
            accounttype: constdata.account_type.STUDENT
          };

          accounts.push(objuser);

          count++;
        }
      }
    });

    var events = ['accounts', 'pages'];
    var ep = new EventProxy();
    ep.all(events, function (accounts, pages) {
      callback();
    });

    ep.fail(function (err) {
      callback(err);
    });

    ep.after('page', accounts.length, function (list) {
      ep.emit('pages', list);
    });

    ep.after('account', accounts.length, function (list) {
      for (var i = 0; i < list.length; i++) {
        UserPageProxy.newAndSave(list[i]._id, 3, false, list[i].name, '', '', '',
          ep.group('page'));
      }
      ep.emit('accounts', list);
    });

    for (var i = 0; i < accounts.length; i++) {
      UserAccountProxy.newAndSave(accounts[i].studentId, accounts[i].name, accounts[i].accounttype, '',
        accounts[i].password, '', false,
        ep.group('account'));
    }
  }

  function add_user(id, name, callback) {
    var account = {
      studentId: id,
      name: name,
      password: functions.password_hash(id.toString()),
      accounttype: constdata.account_type.STUDENT
    };

    var ep = new EventProxy();
    ep.fail(function (err) {
      callback(err);
    });

    UserAccountProxy.newAndSave(account.studentId, account.name, account.accounttype, '',
      account.password, '', false,
      ep.done(function (acc) {
        UserPageProxy.newAndSave(acc._id, 3, false, acc.name, '', '', '',
          ep.done(function (page) {
            callback(null, acc, page);
          }));
      }));
  }

  exports.User = User;
  exports.install_user_single = install_user_single;
  exports.add_user = add_user;

}).call(this);
