
(function() {

  exports.index = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.channel.index;
    data.active = 'channel';

    callback();
  };

}).call(this);