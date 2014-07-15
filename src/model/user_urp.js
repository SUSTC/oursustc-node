var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

var UserUrpSchema = new Schema({
  page_id: { type: ObjectId, unique: true, index: true },

  flags: { type: Number, default: 0 },
  username: { type: String },
  password: { type: String },

  cookie: { type: String },

  info: { type: Schema.Types.Mixed },
  terms: { type: Schema.Types.Mixed },
  courses: { type: Schema.Types.Mixed },

  update_at: { type: Date, default: Date.now }
});

mongoose.model('UserUrp', UserUrpSchema, config.DB_PREFIX + 'user_urp');
