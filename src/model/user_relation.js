var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

var UserRelationchema = new Schema({
  user_id: { type: ObjectId },
  follow_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
});

mongoose.model('UserRelation', UserRelationchema, config.DB_PREFIX + 'user_relation');
