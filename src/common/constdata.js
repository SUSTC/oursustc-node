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

  exports.user_permission = {
    BASE:             0x00000000,
    RESERVE:          0x00000001,
    STU_ACCESS:       0x00000002,


    DASHBOARD:        0x00008000


  };


  exports.board_permission = {
    BASE:              0x00000000,
    RESERVE:           0x00000001,
    STU_ACCESS:        0x00000002,
    STU_POST:          0x00000004,
    TEACHER_ACCESS:    0x00000008,
    TEACHER_POST:      0x00000010,
    EXTERNAL_ACCESS:   0x00000020,
    EXTERNAL_POST:     0x00000040,
    NOACCOUNT_ACCESS:  0x00000080
  };

  exports.account_type = {
    EXTERNAL:          0,
    TEACHER:           1,
    STUDENT:           2
  };
  
}).call(this);
