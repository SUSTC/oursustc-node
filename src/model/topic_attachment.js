var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require("./../config/config.json");

var TopicAttachmentSchema = new Schema({
  topic_id: { type: ObjectId },
  usercontent_id: { type: ObjectId }
});

mongoose.model('TopicAttachment', TopicAttachmentSchema, config.DB_PREFIX + 'topic_attachment');
