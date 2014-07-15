var models = require('../model');
var TopicAttachment = models.TopicAttachment;

exports.getAttachmentByTopicId = function (topicId, callback) {
  TopicAttachment.find({topic_id: topicId}, callback);
};

exports.removeByTopicId = function (topicId, callback) {
  TopicAttachment.remove({topic_id: topicId}, callback);
};

exports.remove = function (topicId, usercontentId, callback) {
  var tas = {topic_id: topicId};
  if (usercontentId instanceof Array) {
    tas.usercontent_id = {'$in': usercontentId};
  } else {
    tas.usercontent_id = usercontentId;
  }

  TopicAttachment.find(tas).remove(callback);
};

exports.newAndSave = function (topicId, usercontentId, callback) {
  if (usercontentId instanceof Array) {
      var tas = [];
      for (var i = 0; i < usercontentId.length; i++) {
        tas.push({
          topic_id: topicId,
          usercontent_id: usercontentId[i]
        });
      }
      if (tas.length > 0) {
        TopicAttachment.create(tas, function (err) {
          callback(err, tas); 
        });
      } else {
        callback(new Error('size zero'));
      }
  } else {
    var ta = new TopicAttachment();
    ta.topic_id = topicId;
    ta.usercontent_id = usercontentId;
    ta.save(callback);
  }
};
