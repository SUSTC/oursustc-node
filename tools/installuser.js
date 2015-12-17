var 
  config = require('../src/config/config.json'),
  core = require('../src/base/core'),
  user = require('../src/class/user');

var args = process.argv;
if (args.length < 3) {
  console.log('Please specify a csv file in \'src/data\' which to be installed.');
  process.exit(1)
} else {
  var userf = args[2];
  var c = new core.Core();
  c.init();

  console.log('installing \'' + userf + '\'...');
  user.install_user_single(userf, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('finished.');
    }
    process.exit(0)
  });
}
