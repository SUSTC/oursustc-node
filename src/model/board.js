var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

var BoardSchema = new Schema({
  name: {
    type: String
  },
  shortcut: {
    type: String
  },
  type: {
    type: Number,
    default: 0
  },
  parent: {
    type: ObjectId
  },
  administrators: {
    type: [ObjectId]
  },
  description:{
    type: String
  },
  tag:{
    type: String
  },
  topic_count: {
    type: Number,
    default: 0
  },
  reply_count: {
    type: Number,
    default: 0
  },
  visit_count: {
    type: Number,
    default: 0
  },
  create_at: {
    type: Date,
    default: Date.now
  },
  update_at: {
    type: Date,
    default: Date.now
  },
  last_reply: {
    type: ObjectId
  },
  last_reply_at: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Board', TopicSchema, config.DB_PREFIX + 'board');
