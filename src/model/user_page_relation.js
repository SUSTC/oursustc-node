var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

var UserPageRelationSchema = new Schema({
  account_id: { type: ObjectId },
  page_id: { type: ObjectId },
  power: { type: Number, default: 0 },
  flags: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now }
});

mongoose.model('UserPageRelation', UserPageRelationSchema, config.DB_PREFIX + 'user_page_relation');
