
(function() {

  var express = require('express'),
    path = require('path'),
    config = require('./../config/config.json'),
    navpages = require('./../config/navpages.json'),
    version = require('./../config/version.json'),
    functions = require("./../common/functions"),
    db = require('./db'),
    classes = require('./../class');
    User = classes.User;
    Resource = classes.Resource;

  var lang = require('./../lang/' + config.LANG + '.json');
  
  function Core() {
    this.lang = lang;
    this.base = {
      'host': config.HOST,
      'qrurl': functions.qrurl,
      'rooturl': config.ROOT_URL,
      'nullurl': 'javascript:void(0)'
    };
    this.api = false;

    this.navpages = functions.clone(navpages);
    this.parseLang(this.navpages);

    this.TIMESTAMP = Date.now();
    this.DATESTAMP = parseInt(this.TIMESTAMP / 1000);

    this.user = new User(this);
    this.resource = new Resource(this);
  }

  Core.prototype.init = function() {
    db.init();
    this.user.init();
    this.resource.init();
  }

  Core.prototype.parseLang = function(obj) {
    for (var key in obj) {
      if (obj[key] instanceof Object) {
        this.parseLang(obj[key]);
      } else if (typeof(obj[key]) === 'string') {
        var langpattern = /^#{lang(\.(.+)){1,}}$/;
        var m = obj[key].match(langpattern);
        if (m) {
          var s = m[2].split('.');
          var tlang = this.lang;
          for (var i = 0; i < s.length; i++) {
            tlang = tlang[s[i]];
          }
          obj[key] = tlang;
        }
      }
    }
  }

  Core.prototype.renderData = function(data) {
    
    data.navpages = this.navpages;
    data.lang = lang;
    data.version = version;

    data.base = this.base;

    this.user.renderData(data);
    //this.resource.renderData(data);
    
    //var debug use for jade
    data.debugclient = config.DEBUG_CLIENT;
  }

  Core.prototype.isLogin = function() {
    return (this.user.uid != 0);
  }

  exports.coreMiddleware = function(req, res, next) {
    var core = new Core();
    core.init();

    core.base.url = req.url;

    res.locals.core = core;
    //self redirect
    core.redirect = function (status, url) {
      if (url) {
        url = this.base.rooturl + url;
      } else if (typeof status == "string") {
        status = this.base.rooturl + status;
      }
      res.redirect(status, url);
    };

    //core debug
    if (config.DEBUG_CORE) {
      
    }

    core.user.checklogin(req.cookies, req, function () {
      next();
    });
  }

}).call(this);