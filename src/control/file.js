
(function() {

  var EventProxy = require('eventproxy');
  //var multiparty = require('multiparty');
  var util = require('util'),
    view = require("./../common/view"),
    constdata = require("./../common/constdata"),
    proxy = require("./../proxy"),
    UserContentProxy = proxy.UserContent;

  var UserContentType = require("./../class/resource").UserContentType;

  exports.index = function(req, res, data, callback) {
    data.title = res.locals.core.lang.title.file;
    data.active = 'file';

    if (req.params.id) {
      UserContentProxy.getContent(req.params.id, function (err, content) {
        if (!err && content) {
          if (content.type == UserContentType.Attachment) {
            //attachment
            res.set('Content-Disposition', 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(content.name));
            res.sendFile(content.path, {root: constdata.PUBLIC_DIR}, function (err) {
              if (err) {
                res.set('Content-Disposition', 'inline;');
                view.showMessage(data, res.locals.core.lang.errmsg.file_not_found, 'error', callback);
              }
            });
          } else {
            res.redirect(content.path);
            callback(true);
          }
        } else {
          view.showMessage(data, res.locals.core.lang.errmsg.file_not_found, 'error', callback);
        }
      });
    } else {
      view.showMessage(data, res.locals.core.lang.errmsg.file_not_found, 'error', callback);
    }
  };

  exports.upload = function(req, res, data, callback) {
    data.err = {};
    if (!res.locals.core.user.page_id) {
      data.err.msg = res.locals.core.lang.errmsg.no_permission;
      callback(true);
      return;
    }

    //multiparty
    /*var form = new multiparty.Form();
    //form.parse(req, function(err, fields, files) {
      //util.inspect(fields);
      if (!fields.csrf || !fields.csrf.length
          || !res.locals.core.user.checkcsrf(fields.csrf[0])) {*/
      if (!res.locals.core.user.checkcsrf(req.body.csrf)) {
        data.err.msg = res.locals.core.lang.errmsg.error_params;
        callback(true);
        return;
      }

      //only one file per upload request
      //multiparty
      //var file = files && files.userfile && files.userfile.length && files.userfile[0];
      var file = req.files && req.files.userfile;
      if (!file) {
        data.err.msg = 'no file';
        callback(true);
        return;
      }

      res.locals.core.resource.add(file, true, function (err, content, path) {
        if (err) {
          data.err.msg = err.toString();
        } else if (content) {
          data.file = {
            id: content._id,
            page_id: content.page_id,
            name: content.name,
            type: content.type,
            upload_at: content.upload_at,
            update_at: content.update_at
          };
        }
        callback(true);
      });
    //});
  };

}).call(this);