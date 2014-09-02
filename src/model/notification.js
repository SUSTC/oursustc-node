var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

/*
 * type:
 * message: 私信
 * reply: xx 回复了你的话题
 * reply2: xx 回复 xx 话题 (曾经回复过的)
 * follow: xx 关注了你
 * at: xx ＠了你
 */

var NotificationSchema = new Schema({
  type: { type: String },
  master_id: { type: ObjectId },
  author_id: { type: ObjectId },
  topic_id: { type: ObjectId },
  reply_id: { type: ObjectId },
  body: { type: String },
  has_read: { type: Boolean, default: false },
  create_at: { type: Date, default: Date.now }
});

NotificationSchema.index({master_id: 1, create_at: -1});

mongoose.model('Notification', NotificationSchema, config.DB_PREFIX + 'notification');
