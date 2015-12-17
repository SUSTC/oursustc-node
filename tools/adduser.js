var 
  config = require('../src/config/config.json'),
  core = require('../src/base/core'),
  user = require('../src/class/user');

var args = process.argv;
if (args.length < 4) {
  console.log('Please specify id and name.');
  process.exit(1);
} else {
  var userid = args[2];
  var name = args[3];
  var c = new core.Core();
  c.init();

  user.add_user(userid, name, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('finished.');
    }
    process.exit(0)
  });
}