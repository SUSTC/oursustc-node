var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require("./../config/config.json");

var UserPageSchema = new Schema({

  name: { type: String },
  name_clean: { type: String, unique: true, index: true },
  email: { type: String },  //, unique: true
  url: { type: String },

  new_notification: { type: Number, default: 0 },

  contact: { type: String },
  location: { type: String },
  website: { type: String },
  bio: { type: String },
  signature: { type: String },

  noaccount: { type: Boolean },

  avatar: { type: String },
  cover: { type: String },

  score: { type: Number, default: 0 },
  level: { type: Number, default: 0 },

  topic_count: { type: Number, default: 0 },
  reply_count: { type: Number, default: 0 },
  follower_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },
  collect_tag_count: { type: Number, default: 0 },
  collect_topic_count: { type: Number, default: 0 },

  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  is_star: { type: Boolean },

  permission: { type: Number, default: 0 },
  flags: { type: Number, default: 0 },
});

UserPageSchema.virtual('avatar_url').get(function () {
  return this.avatar;
});

UserPageSchema.virtual('front_cover_url').get(function () {
  return this.cover;
});

mongoose.model('UserPage', UserPageSchema, config.DB_PREFIX + 'user_page');
