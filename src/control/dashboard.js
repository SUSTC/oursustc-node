
(function() {

  var EventProxy = require('eventproxy');

  var fs = require('fs'),
    path = require('path'),
    mvc = require('./../base/mvc'),
    functions = require('./../common/functions'),
    constdata = require("./../common/constdata"),
    string = require('./../common/string'),
    config = require('./../config/config.json');

  var view = require("./../common/view"),
    proxy = require("./../proxy"),
    models = require('./../model'),
    UserAccountProxy = proxy.UserAccount,
    UserPageProxy = proxy.UserPage,
    UserPageRelationProxy = proxy.UserPageRelation,
    BoardProxy = proxy.Board;

  var tablepre = config.DB_PREFIX;

  var permission = constdata.user_permission;

  function _in_array(searchString, array) {
    for (i=0; i<array.length; i++) {
      if ( searchString == array[i] ) return true;
    }
    return false;
  }

  function lineSplit(file, callback) {
    var filedata = fs.readFileSync(file, 'utf8');
    if (filedata) {
      filedata = filedata.replace(/\r/g, '');
      var strproducts = filedata.split('\n');
      for (var i = 0; i < strproducts.length; i++) {
        // 移除空行和注释行
        if (strproducts[i] && strproducts[i].substr(0, 1) !== '#') {
          callback(strproducts[i]);
        }
      }
    }
  }

  function install_database_drop(data, res, callback) {
    var ep = new EventProxy();
    var count = 0;
    for (var key in models) {
      count++;
    }

    ep.after('remove', count, function () {
      callback();
    });

    for (var key in models) {
      console.log('droping: ' + key);
      models[key].remove(ep.done('remove'));
    }
  }

  function install_user(data, res, callback) {

    var count = 0, startStudentId = 0;
    var accounts = [];
    lineSplit('src/data/user_account.csv', function(line) {
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

    var events = ['accounts', 'pages', 'page_set'];
    var ep = new EventProxy();
    var epf = EventProxy.create(events, function (accounts, pages, page_set) {
      if (page_set.length > 0) {
        ep.after('otherpages', page_set.length, function () {
          callback();
        });
        
        for (var i = 0; i < page_set.length; i++) {
          var accountId = 0;
          for (var j = 0; j < accounts.length; j++) {
            if (accounts[j].student_id == page_set[i].studentId) {
              accountId = accounts[j]._id;
              break;
            }
          }
          if (accountId) {
            UserPageProxy.newAndSave(accountId, 3, true, page_set[i].name, '', '', '',
              ep.group('otherpages'), page_set[i].permission);
          } else {
            ep.emit('otherpages', null);
          }
        }
      } else {
        callback();
      }
    });

    epf.fail(function (err) {
      ep.unbind();
      callback();
    });

    ep.after('page', accounts.length, function (list) {
      epf.emit('pages', list);
    });

    ep.after('account', accounts.length, function (list) {
      for (var i = 0; i < list.length; i++) {
        UserPageProxy.newAndSave(list[i]._id, 3, false, list[i].name, '', '', '',
          ep.group('page'));
      }
      epf.emit('accounts', list);
    });

    for (var i = 0; i < accounts.length; i++) {
      UserAccountProxy.newAndSave(accounts[i].studentId, accounts[i].name, accounts[i].accounttype, '',
        accounts[i].password, '', false,
        ep.group('account'));
    }

    var page_set = [];
    lineSplit('src/data/user_page_owner.csv', function(line) {
      var pagedata = line.split(',');
      if (pagedata && pagedata.length >= 2) {
        var studentid_ = parseInt(pagedata[1]);
        if (pagedata[0] && studentid_ > 0) {
          var pageobj = {
            name: pagedata[0],
            studentId: studentid_
          };
          if (pagedata.length >= 3 && pagedata[2]) {
            pageobj.permission = parseInt(pagedata[2]);
          }
          page_set.push(pageobj);
        }
      }
    });

    epf.emit('page_set', page_set);
/*
    var accountUids = {};
    if (page_set.length > 0) {
      var accountSids = [];

      accountSids.push(startStudentId);
      for (var i = 0; i < page_set.length; i++) {
        accountSids.push(page_set[i].studentid);
      }

      var accountRows = table_user_account._select('uid, studentid', {studentid: accountSids});
      var notfoundUids = [];
      accountUids = functions.findshift(accountRows, accountSids, 'studentid', 'uid', notfoundUids);
    }
    
    mvc.log(accountUids);

    var startuid = accountUids[startStudentId];

    db.begin();
    for (var i = 0; i < page_set.length; i++) {
      table_user_page.update({username: page_set[i].name}, {uid: accountUids[page_set[i].studentid]});
    }

    for (var i = 0; i < count; i++) {
      var objuserpage = {
        uid: startuid + i,
        regdate: DATESTAMP
      };
      table_user_page.insert(objuserpage);
      mvc.log(objuserpage);
    }
    db.commit();
*/
  }

  function install_board(data, res, callback) {
    var count = 0;
    var boards = [];
    lineSplit('src/data/board.csv', function(line) {
      var boarddata = line.split(',');
      if (boarddata && boarddata.length >= 3) {
        var shortcut_ = string.clean(boarddata[0]);
        var access_ = parseInt(boarddata[2]);
        if (shortcut_ && boarddata[1]) {
          var objboard = {
            shortcut: shortcut_,
            name: boarddata[1],
            access: access_
          };

          boards.push(objboard);

          count++;
        }
      }
    });

    if (count <= 0) {
      callback();
      return;
    }

    var ep = new EventProxy();
    ep.after('board', boards.length, function (list) {
      callback();
    });

    ep.fail(function (err) {
      callback();
    });

    for (var i = 0; i < boards.length; i++) {
      BoardProxy.newAndSave(boards[i].shortcut, boards[i].name, 0, boards[i].access,
        '', null, ep.done('board'));
    }
  }

  function haveDashboardPermission(res) {
    return ((res.locals.core.user.page.permission & permission.DASHBOARD) 
        && res.locals.core.user.page.power >= 3);
  }

  exports.index = function (req, res, data, callback) {
    data.title = res.locals.core.lang.title.dashboard.index;
    data.active = 'dashboard';

    if (res.locals.core.isLogin()) {
      if (!haveDashboardPermission(res)) {
        view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
        return;
      }
      callback();
    } else {
      res.redirect('/user/login?url=/dashboard');
      callback(true);
    }
  };

  exports.consts = function (req, res, data, callback) {
    data.title = res.locals.core.lang.title.dashboard.consts + ' - ' + res.locals.core.lang.title.dashboard.index;
    data.active = 'dashboard';
    
    data.err = {};

    if (res.locals.core.isLogin()) {
      if (!haveDashboardPermission(res)) {
        view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
        return;
      }

      data.constdata = constdata;
      callback();

    } else {
      res.redirect('/user/login?url=/dashboard/consts');
      callback(true);
    }
  };

  exports.board = function (req, res, data, callback) {
    data.title = res.locals.core.lang.title.dashboard.board + ' - ' + res.locals.core.lang.title.dashboard.index;
    data.active = 'dashboard';

    data.err = {};

    if (res.locals.core.isLogin()) {
      if (!haveDashboardPermission(res)) {
        view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
        return;
      }
      var ndo = function () {
        if (req.method == 'POST') {
          if (res.locals.core.user.checkcsrf(req.body.csrf)
              && req.body.board && req.body.board.shortcut) {
            var b = req.body.board;
            if (b.parent == '_top') {
              b.parent = null;
            }
            var events = ['board', 'parent'];
            var ep = EventProxy.create(events, function (board, parent) {
              if (b.parent && !parent) {
                data.err.parent = true;
                ep.emit('finish', false);
                return;
              }
              switch (req.body.action) {
                case 'new_board':
                  if (!b.name) {
                    data.err.board_name = true;
                    ep.emit('finish', false);
                  } else if (board) {
                    data.err.shortcut = true;
                    ep.emit('finish', false);
                  } else {
                    BoardProxy.newAndSave(b.shortcut, b.name, 1, parseInt(b.access),
                        b.description, parent ? parent._id : null, ep.done('finish'));
                  }
                  break;
                case 'set_board_info':
                  if (!b.name) {
                    data.err.board_name = true;
                    ep.emit('finish', false);
                  } else if (!board) {
                    data.err.shortcut = true;
                    ep.emit('finish', false);
                  } else if (parent && parent.shortcut == b.shortcut) {
                    data.err.parent = true;
                    ep.emit('finish', false);
                  } else {
                    board.name = b.name;
                    board.access = parseInt(b.access);
                    board.description = b.description;
                    board.parent = parent ? parent._id : null;
                    board.save(ep.done('finish'));
                  }
                  break;
                case 'set_board_administrators':
                  if (!board) {
                    data.err.shortcut = true;
                    ep.emit('finish', false);
                  } else {
                    var administrator_ids = [];
                    if (b.administrator_ids && b.administrator_ids.length > 0) {
                      //check is_objectid 
                      for (var i = 0; i < b.administrator_ids.length; i++) {
                        if (string.is_objectid(b.administrator_ids[i])) {
                          administrator_ids.push(b.administrator_ids[i]);
                        }
                      }
                    }
                    board.administrator_ids = administrator_ids;
                    board.save(ep.done('finish'));
                  }
                  break;
                case 'delete_board':
                  if (!board) {
                    data.err.shortcut = true;
                    ep.emit('finish', false);
                  } else {
                    BoardProxy.removeBoardById(board._id, ep.done('finish'));
                  }
                  break;
                default:
                  ep.emit('finish', false);
                  break;
              }
            });
            ep.once('finish', function (succeed) {
              if (succeed) {
                view.showMessage(data, res.locals.core.lang.info.success, 'success', '/dashboard/board', callback);
              } else {
                callback();
              }
            });
            BoardProxy.getBoardByShortcut(b.shortcut, ep.done('board'));
            if (b.parent) {
              if (string.is_objectid(b.parent)) {
                BoardProxy.getBoard(b.parent, ep.done('parent'));
              } else {
                BoardProxy.getBoardByShortcut(b.parent, ep.done('parent'));
              }
            } else {
              ep.emit('parent', null);
            }
          } else {
            view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', callback);
          }
          return;
        }
        callback();
      };
      BoardProxy.fetchAll(function (err, boards) {
        data.boards = boards;

        var admin_ids = [];
        for (var i = 0; i < boards.length; i++) {
          for (var j = 0; j < boards[i].administrator_ids.length; j++) {
            if (admin_ids.indexOf(boards[i].administrator_ids[j]) === -1) {
              admin_ids.push(boards[i].administrator_ids[j]);
            }
          }
        }

        if (admin_ids.length > 0) {
          UserPageProxy.getUsersByIds(admin_ids, function (err, pages) {
            var administrators = {};
            if (pages) {
              for (var i = 0; i < pages.length; i++) {
                administrators[pages[i]._id] = pages[i];
              }
            }
            data.administrators = JSON.stringify(administrators);
            ndo();
          });
        } else {
          data.administrators = '{}';
          ndo();
        }
      });
    } else {
      res.redirect('/user/login?url=/dashboard/board');
      callback(true);
    }
  };

  exports.user = function (req, res, data, callback) {
    data.title = res.locals.core.lang.title.dashboard.user + ' - ' + res.locals.core.lang.title.dashboard.index;
    data.active = 'dashboard';

    data.err = {};

    if (res.locals.core.isLogin()) {
      if (!haveDashboardPermission(res)) {
        view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
        return;
      }
      if (req.method == 'POST') {
        if (res.locals.core.user.checkcsrf(req.body.csrf) && req.body.user) {
          var events = ['account', 'page'];
          var ep = EventProxy.create(events, function (account, page) {
            switch (req.body.action) {
              case 'change_password':
                if (!account) {
                  data.err.account = true;
                  break;
                }
                if (req.body.user.new_password && req.body.user.new_password.length >= constdata.MIN_PASSWORD_LENGTH) {
                  account.update_at = Date.now();
                  account.password = functions.password_hash(req.body.user.new_password);
                  account.save(function (err) {
                    ep.emit('finish', !err);
                  });
                } else {
                  data.err.new_password = true;
                }
                break;
              case 'set_page_permission':
                if (!page) {
                  data.err.page = true;
                  break;
                }
                if (string.is_numeric(req.body.user.permission)) {
                  var ipermission = parseInt(req.body.user.permission);
                  page.update_at = Date.now();
                  page.permission = ipermission;
                  page.save(function (err) {
                    ep.emit('finish', !err);
                  });
                } else {
                  data.err.permission = false;
                }
                break;
              case 'set_relation_power':
                if (!account || !page) {
                  if (!account) data.err.account = true;
                  if (!page) data.err.page = true;
                  break;
                }
                if (string.is_numeric(req.body.user.power)) {
                  var ipower = parseInt(req.body.user.power);
                  UserPageRelationProxy.getRelation(account._id, page._id, function (err, r) {
                    r.power = ipower;
                    r.save(function (err) {
                      ep.emit('finish', !err);
                    });
                  });
                } else {
                  data.err.power = false;
                }
                break;
            }

            if (!functions.is_object_empty(data.err)) {
              ep.emit('finish', false);
            }
            
          });

          ep.once('finish', function (succeed) {
            if (succeed) {
              view.showMessage(data, res.locals.core.lang.info.success, 'success', '/dashboard/user', callback);
            } else {
              callback();
            }
          });

          if (req.body.user.studentid && string.is_numeric(req.body.user.studentid)) {
            UserAccountProxy.getUserByStudentId(req.body.user.studentid, ep.done('account'));
          } else {
            ep.emit('account', null);
          }
          if (req.body.user.page) {
            UserPageProxy.getUserByName(req.body.user.page, ep.done('page'));
          } else {
            ep.emit('page', null);
          }
        } else {
          view.showMessage(data, res.locals.core.lang.errmsg.error_params, 'error', callback);
        }
        return;
      }
      callback();
    } else {
      res.redirect('/user/login?url=/dashboard/user');
      callback(true);
    }
  };

  exports.install = function(req, res, data, callback) {
    /*data.title = res.locals.core.lang.dashboard.install + ' - ' + res.locals.core.lang.title.dashboard.index;
    data.active = 'dashboard';

    //no need to check permission
    if (res.locals.core.isLogin()) {
      if (!haveDashboardPermission(res)) {
        view.showMessage(data, res.locals.core.lang.errmsg.no_permission, 'error', '/', callback);
        return;
      }
    } else {
      res.redirect('/user/login?url=/dashboard/install');
      callback(true);
      return;
    }*/

    var INSTALL_LOCK = 'public/data/install.lock';
    if (fs.existsSync(INSTALL_LOCK)) {
      data.err = 'installed';
      callback(true);
      return;
    }

    //v0.10.0 ~> {encoding: 'utf8'}
    var install_step = ['', 'drop', 'base', 'data', 'user', 'board'];
    var install_method = [null, install_database_drop,
        'src/data/db_install.sql', 'src/data/db_install_data.sql',
        install_user, install_board];
    var istep = -1;
    if (!req.query.do) {
      istep = 0;
    } else {
      istep = install_step.indexOf(req.query.do);
    }
    if (istep >= 0) {
      var startTime = Date.now();
      data.err = null;

      var callbackFunction = function () {
        var isfinish = false;
        data.step = install_step[istep];
        if (!data.err) {
          if (istep < install_step.length - 1) {
            res.redirect('/dashboard/install?do=' + install_step[istep + 1]);
          } else {
            isfinish = true;
            fs.writeFile(INSTALL_LOCK, 'SUSTC', function (err) {
              if (err) {
                mvc.error(err);
              }
            });
          }
        }

        var endTime = Date.now();
        mvc.log(((endTime - startTime) / 1000).toFixed(2) + 's');

        if (isfinish) {
          view.showMessage(data, res.locals.core.lang.info.success, 'success', '/dashboard', callback);
        } else {
          callback(true);
        }
      };

      if (install_method[istep] instanceof Function) {
        install_method[istep](data, res, callbackFunction);
      } else {
        if (install_method[istep]) {
          var filedata = fs.readFileSync(install_method[istep], 'utf8');
          if (filedata) {
            //runquery(filedata);
          } else {
            // 其实会产生500错误
            data.err = "Can't read file!";
          }
        }
        callbackFunction();
      }
    }

  };

}).call(this);