
(function() {

  var path = require('path');

  var public_dir = path.resolve(__dirname, '../../public') + '/';

  var upload_dir = public_dir + 'data/';
  var tmp_dir = public_dir + 'data/tmp/';

  exports.PUBLIC_DIR = public_dir;

  exports.UPLOAD_DIR = upload_dir;
  exports.TMP_DIR = tmp_dir;

  exports.action = {
    PURCHASE: 5
  };

  exports.MIN_PASSWORD_LENGTH = 6;

  exports.permission = {
    BASE:              0x00000000,
    RESERVE:           0x00000001,
    ADD_NEWS:          0x00000002,
    MANAGE_NEWS:       0x00000004,
    ADD_COURSEWARE:    0x00000008,
    MANAGE_COURSEWARE: 0x00000010,
    ADD_POST:          0x00000020,
    MANAGE_POST:       0x00000040,


    DASHBOARD: 0x00008000


  };

}).call(this);