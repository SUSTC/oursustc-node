"use strict";

var request = require('request');

var SUSTC_CAS_URL = 'http://weblogin.sustc.edu.cn';

function CAS() {
  this.cookie = '';
}

CAS.prototype.processCookie = function (res) {
  if (res && res.headers['set-cookie']) {
    var cookies = res.headers['set-cookie'];
    var strCookie = '';
    for (var i = 0; i < cookies.length; i++) {
      var isplit = cookies[i].indexOf(';');
      if (i > 0) {
        strCookie += '; ';
      }
      if (isplit !== -1) {
        strCookie += cookies[i].substring(0, isplit);
      } else {
        strCookie += cookies[i];
      }
    }
    this.setCookie(strCookie);
  }
};

CAS.prototype.setCookie = function (cookie) {
  this.cookie = cookie ? cookie : '';
  this.jid = '';
  if (this.cookie) {
    var cl = this.cookie.split(';');
    for (var i = 0; i < cl.length; i++) {
      var kv = cl[i].split('=');
      if (kv.length == 2 && kv[0] == 'JSESSIONID') {
        this.jid = kv[1];
        //break; prevent override
      }
    }
  }
  //console.log('setCookie:', this.cookie, this.jid);
};

CAS.prototype.request = function (url, formdata, callback, raw) {
  var options = {
    url: SUSTC_CAS_URL + url,
    //method: 'POST',
    headers: {
      'Cookie': this.cookie,
      //'Connection': 'keep-alive'
    }
  };
  if (formdata instanceof Function) {
    raw = callback;
    callback = formdata;
    formdata = null;
    options.method = 'GET';
  } else if (!formdata) {
    formdata = null;
    options.method = 'GET';
  } else {
    options.method = 'POST';
    //options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    //options.headers['Content-Length'] = formdata.length;
    options.form = formdata;
  }
  if (raw) {
    // for Buffer return
    options.encoding = null;
  }
  var that = this;
  request(options, function (err, res, str) {
    if (err) {
      return callback(err);
    }
    that.processCookie(res);
    callback(null, str);
  });
};

CAS.prototype.login = function (username, password, callback) {
  var that = this;
  this.request('/cas/login', function (err, html) {
    if (err) {
      callback(err);
      return;
    }
    var exec_regex = /<input type="hidden" name="execution" value="(.*?)"/i;
    var lt_regex = /<input type="hidden" name="lt" value="(.*?)"/i;
    var m_exec = html.match(exec_regex);
    var m_lt = html.match(lt_regex);
    if (m_exec && m_lt) {
      //username=11210025&password=020032&lt=LT-66237060-VYhQmXmTSPa5bQNekHesTLq4GwEn3r&execution=e2s1&_eventId=submit&submit=%E7%99%BB%E5%BD%95
      var formdata = 'username=' + encodeURIComponent(username)
          + '&password=' + encodeURIComponent(password)
          + '&lt=' + m_lt[1]
          + '&execution=' + m_exec[1]
          + '&_eventId=submit&submit=%E7%99%BB%E5%BD%95';

      that.request('/cas/login', formdata, function (err, html) {
        if (err) {
          callback(err);
          return;
        }
        if (html.indexOf('<div id="msg" class="success">') >= 0) {
          callback(err, true);
        } else {
          var err_regex = /<div class="box fl-panel" id="login">[\s\S]*?<div id="msg" class="errors">([\s\S]*?)<\/div>/i;
          var m = html.match(err_regex);
          callback(m ? m[1] : 'unknow error', false);
        }
      });
    } else {
      callback('get login info failed');
    }
  });
};

exports.CAS = CAS;
