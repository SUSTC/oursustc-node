"use strict";

var http = require('http'),
  BufferHelper = require('bufferhelper');

var SUSTC_CAS_HOST = 'weblogin.sustc.edu.cn';
var SUSTC_CAS_PORT = 80;

function CAS() {
  this.cookie = '';
}

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
    hostname: SUSTC_CAS_HOST,
    port: SUSTC_CAS_PORT,
    path: url,
    //method: 'POST',
    headers: {
      'Cookie': this.cookie,
      'Connection': 'keep-alive'
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
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = formdata.length;
  }
  var that = this;
  var req = http.request(options, function (res) {
    if (res.headers['set-cookie']) {
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
      that.setCookie(strCookie);
    }
    var buffer = new BufferHelper();
    res.on('data', function (chunk) {
      buffer.concat(chunk);
    });
    res.on('end', function () {
      var buf = buffer.toBuffer();
      if (raw) {
        callback(null, buf);
      } else {
        //var str = iconv.decode(buf, 'gbk');
        var str = buf.toString();
        callback(null, str);
      }
    });
  });
  req.on('error', function (e) {
    callback(e);
  });
  if (formdata) {
    req.write(formdata);
  }
  req.end();
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
