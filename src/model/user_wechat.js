var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

var UserWechatSchema = new Schema({
  open_id: { type: String, unique: true, index: true },
  subscribe: { type: Boolean, default: true },
  user_id: { type: ObjectId, index: true },
  student_id: { type: String },
  create_at: { type: Date, default: Date.now }
});

mongoose.model('UserWechat', UserWechatSchema, config.DB_PREFIX + 'user_wechat');