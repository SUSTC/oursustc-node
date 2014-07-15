var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require("./../config/config.json");

var UserAccountSchema = new Schema({
  //uid: { type: Number, default: 0, unique: true, index: true },
  student_id: { type: String, unique: true, index: true },
  name: { type: String },

  loginname: { type: String },
  loginname_clean: { type: String },  //, unique: true

  password: { type: String },
  email: { type: String },  //, unique: true

  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },

  activate: { type: Boolean, default: true },

  retrieve_time : {type: Number},
  retrieve_key : {type: String}
});

UserAccountSchema.virtual('uid').get(function () {
  return this._id.toHexString();
});

mongoose.model('UserAccount', UserAccountSchema, config.DB_PREFIX + 'user_account');
