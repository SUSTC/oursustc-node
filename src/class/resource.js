
(function() {

  var functions = require("./../common/functions"),
    string = require("./../common/string"),
    constdata = require("./../common/constdata"),
    path = require('path'),
    proxy = require("./../proxy"),
    UserContentProxy = proxy.UserContent;

  var UserContentType = {
    Attachment: 0,
    Image: 1
  };

  exports.UserContentType = UserContentType;

  function Resource(core) {
    this.core = core;
    this.parse_queue = [];
    this.resurl = {};
  }

  Resource.prototype.init = function() {
  }

  Resource.prototype.renderData = function(data) {
    /*if (this.parse_queue.length > 0) {
      var rows = table_resource._query(this.parse_queue);
      if (rows && rows[0]) {
        for (var i = 0; i < rows.length; i++) {
          this.resurl[rows[i].resource_id] = this.geturl(rows[i].resource_id, rows[i].fileext, rows[i].updatedate);
        }
      }
    }
    data.resurl = this.resurl;*/
  }

  Resource.prototype.gettype = function(fileext) {
    var image_fileext = [
      'jpg', 'png', 'jpeg', 'bmp', 'gif', 'webp'
    ];
    if (image_fileext.indexOf(fileext.toLowerCase()) !== -1) {
      return UserContentType.Image;
    } else {
      return UserContentType.Attachment;
    }
  };

  Resource.prototype.gettypestr = function(fileext) {
    switch (this.gettype(fileext)) {
      case UserContentType.Image:
        return 'image';
        break;
      case UserContentType.Attachment:
        return 'attachment';
        break;
    }
    return 'attachment';
  };

  Resource.prototype.getpath = function(fileext, pathPrefix) {
    var savepath = '';
    if (pathPrefix) {
      savepath += pathPrefix;
    }
    savepath += this.gettypestr(fileext);
    functions.mkdir(savepath);

    var currentDate = new Date(this.core.TIMESTAMP);
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth() + 1;

    savepath += '/' + year.toString();
    functions.mkdir(savepath);

    savepath += '/' + (month < 10 ? '0' : '') + month.toString();
    functions.mkdir(savepath);

    savepath += '/';
    return savepath;
  };

  Resource.prototype.getsavedir = function(fileext) {
    var savepath = this.getpath(fileext, constdata.UPLOAD_DIR);
    return savepath;
  }

  Resource.prototype.geturl = function(resource_id, fileext, updatedate) {
    var currentDate = new Date(updatedate);
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth() + 1;

    var url = '/data/' + this.gettypestr(fileext) + '/' + year.toString() + '/' 
                + (month < 10 ? '0' : '') + month.toString() + '/' + resource_id.toString() + (fileext ? ('.' + fileext) : '');
    return url;            
  }

  Resource.prototype.inqueue = function(id) {
    for (var i = 0; i < this.parse_queue.length; i++) {
      if (this.parse_queue[i] === id) {
        return true;
      }
    }
    return false;
  }

  Resource.prototype.parseObj = function(obj) {
    if (!obj) {
      return;
    }
    if (obj instanceof Array) {
      for (var i = 0; i < obj.length; i++) {
        this.parseObj(obj[i]);
      }
    } else if (obj instanceof Object) {
      if (obj.resource_id) {
        var id_ = parseInt(obj.resource_id);
        if (id_ > 0 && !this.resurl[id_] && !this.inqueue(id_)) {
          this.parse_queue.push(id_);
        }
      }
    }
  }

  Resource.prototype.parse = function(id) {
    if (typeof(id) === 'object') {
      for (var key in id) {
        var id_ = parseInt(id[key]);
        if (id_ > 0 && !this.resurl[id_] && !this.inqueue(id_)) {
          this.parse_queue.push(id_);
        }
      }
    } else {
      var id_ = parseInt(id);
      if (id_ > 0 && !this.resurl[id_] && !this.inqueue(id_)) {
        this.parse_queue.push(id_);
      }
    }
  }

  Resource.prototype.add = function(file, copy, callback) {
    if (file.size > 0) {
      if (!file.name) {
        //use multiparty
        file.name = file.originalFilename;
      }
      var ext = path.extname(file.name); // with dot
      if (ext) {
        //remove dot
        ext = ext.substring(1);
      }
      ext = ext.toLowerCase();

      //var resource_id = table_resource.insert(this.core.user.uid, file.name, ext, 0, this.core.DATESTAMP);
      var filetype = this.gettype(ext);
      var that = this;

      UserContentProxy.newAndSave(this.core.user.page_id, file.name, ext, filetype, '', function (err, content) {
        if (!err && content) {
          var resource_id = content._id.toString();
          
          var filepath = that.geturl(resource_id, ext, that.core.TIMESTAMP);
          var savepath = that.getsavedir(ext);

          savepath += resource_id;
          if (ext) {
            savepath += '.' + ext;
          }
          if (copy) {
            functions.cp(file.path, savepath);
          } else {
            functions.mv(file.path, savepath);
          }

          content.path = filepath;
          content.save(function (err, content) {
            callback(null, content, savepath);
          });

          //this.resurl[resource_id] = this.geturl(resource_id, ext, this.core.DATESTAMP);
        } else {
          callback(err ? err : 'Error content or filename');
        }
      });
      return true;
    }
    callback(new Error('zero file size'));
    return false;
  }

  exports.Resource = Resource;

}).call(this);