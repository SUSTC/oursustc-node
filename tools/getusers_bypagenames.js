
var 
  EventProxy = require('eventproxy'),
  _ = require('underscore');

var 
  config = require('../src/config/config.json'),
  core = require('../src/base/core'),
  user = require('../src/class/user');

var Proxy = require('../src/proxy'),
  TopicProxy = Proxy.Topic,
  ReplyProxy = Proxy.Reply,
  UserAccountProxy = Proxy.UserAccount,
  UserPageProxy = Proxy.UserPage,
  UserPageRelationProxy = Proxy.UserPageRelation;

var c = new core.Core();
c.init();

var ep = EventProxy.create();

ep.fail(function (err) {
  console.error(err);
  process.exit(0);
});

/*ep.once('users', function (users) {
  var strAtList = '';
  users.forEach(function (user) {
    strAtList += '@' + user.name + ' ';
  });
  console.log(strAtList);
  process.exit(0);
});*/

ep.once('accounts', function (accounts) {
  var strAccList = '';
  accounts.forEach(function (acc) {
    strAccList += acc.student_id + ' ' + acc.name + '\n';
  });
  console.log(strAccList);
  process.exit(0);
});

ep.once('rs', function (rs) {
  var account_page_maps = {};
  var account_ids = [], page_ids = [];

  rs.forEach(function (r) {
    if (r.power == 3) {
      var strAccountId = r.account_id.toString();
      var strPageId = r.page_id.toString();
      if (!account_page_maps[strAccountId]) {
        account_page_maps[strAccountId] = [];
      }
      account_page_maps[strAccountId].push(strPageId);
    }
  });

  for (var account_id in account_page_maps) {
    account_ids.push(account_id);
    page_ids.push(account_page_maps[account_id][0]);
  }

  page_ids = _.uniq(page_ids);

  //UserPageProxy.getUsersByIds(page_ids, ep.done('users'));
  UserAccountProxy.getUsersByQuery({_id: {$in: account_ids}}, ep.done('accounts'));
});

//var users = ['北城未晴',  '云卿睎滃',  '林凡',  'doly',  '史颂',  '岑岚',  '彭昌梁',  'forever',  '侯鑫萍'];
var users = ['云卿睎滃'];
UserPageProxy.getUsersByNames(users, ep.done(function (users) {
  var user_ids = [];
  users.forEach(function (user) {
    user_ids.push(user._id);
  });
  UserPageRelationProxy.getRelationsByPageId({$in: user_ids}, ep.done('rs'));
}));
