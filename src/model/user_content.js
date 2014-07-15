var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

var UserContentSchema = new Schema({
  page_id: { type: ObjectId },

  name: { type: String },
  ext: { type: String },

  type: { type: Number, default: 0 },

  path: { type: String },

  upload_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now }
});

mongoose.model('UserContent', UserContentSchema, config.DB_PREFIX + 'user_content');
