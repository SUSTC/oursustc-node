
(function() {

"use strict";

var request = require('request'),
  //fs = require('fs'),
  constdata = require("./../../common/constdata"),
  tesseract = require('tesseract_native'),
  iconv = require('iconv-lite');

function URPSystem() {
  this.host = '172.18.1.77';
  this.port = 80;
  this.url = 'http://' + this.host;
  this.cookie = '';
  this.jid = '';
}

//change password
//http://172.18.1.77/modifyPassWordAction.do?pwd=xxx

URPSystem.prototype.processCookie = function (res) {
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

URPSystem.prototype.setCookie = function (cookie) {
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

URPSystem.prototype.request = function (url, formdata, callback, raw) {
  var options = {
    // for Buffer return
    encoding: null,
    url: this.url + url,
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
  var that = this;
  request(options, function (err, res, buf) {
    if (err) {
      return callback(err);
    }
    that.processCookie(res);
    if (raw) {
      return callback(null, buf);
    }
    var str = iconv.decode(buf, 'gbk');
    callback(null, str);
  });
};

URPSystem.prototype.trim = function (str) {
  if (typeof(str) == "string") {
    return str.replace(/^(&nbsp;|\s)*(.*?)(&nbsp;|\s)*$/ig, '$2');
  }
  return "";
};

URPSystem.prototype.parsescore = function (sscore) {
  if (/^[0-9\.]+$/.test(sscore)) {
    return parseFloat(sscore);
  } else {
    return sscore;
  }
};

URPSystem.prototype.init = function () {

};

URPSystem.prototype.getValidateCode = function (callback) {
  var that = this;
  this.request('/validateCodeAction.do?random=' + Math.random(), function (err, buf) {
    if (err) {
      callback(err);
      return;
    }
    var myocr = new tesseract.OcrEio();
    myocr.ocr(buf, { psm: 8 }, function(err, result) {
      if (err) {
        return callback(err);
      }
      callback(null, that.trim(result));
    });
    /* var fname = constdata.TMP_DIR + 'vcode/' + that.jid + '.jpg';
    fs.writeFile(fname, buf, function (e) {
      if (e) {
        callback(e);
        return;
      }
      
      var options = {
        l: 'eng',
        psm: 8
        //,binary: '/usr/local/bin/tesseract'
      };
      tesseract.process(fname, options, function (err, text) {
        //fs.unlink(fname);
        text = that.trim(text);
        callback(err, text);
      });
    }); */
  }, true);
};

URPSystem.prototype.login = function (username, password, callback, depth) {
  var that = this;
  depth = depth ? depth : 0;
  this.getValidateCode(function (err, vcode) {
    if (err) {
      callback(err);
      return;
    }
    //console.log('vcode:', vcode);
    /*var formdata = 'zjh1=&tips=&lx=&evalue=&eflag=&fs=&dzslh='
        + '&zjh=' + encodeURIComponent(username)
        + '&mm=' + encodeURIComponent(password)
        + '&v_yzm=' + vcode;*/
    var formdata = {
      zjh1: '', tips: '', lx: '', evalue: '', eflag: '', fs: '', dzslh: '',
      zjh: username,
      mm: password,
      v_yzm: vcode
    };
    that.request('/loginAction.do', formdata, function (err, data) {
      if (err) {
        callback(err);
      } else {
        var errpos = data.indexOf('<td class="errorTop">');
        if (errpos !== -1) {
          var errposend = data.indexOf('</td>', errpos);
          var errstr = data.substring(errpos, errposend);
          var m = errstr.match(/<font.*?>(.+?)<\/font>/);
          if (m) {
            errstr = m[1];
          }
          if (errstr.indexOf('验证码错误') !== -1 && depth < 15) {
            that.login(username, password, callback, depth + 1);
            return;
          }
          callback(errstr);
        } else {
          callback();
        }
      }
    }); //loginAction
  }); //getValidateCode
};

URPSystem.prototype.getInfo = function (callback) {
  this.request('/xjInfoAction.do?oper=xjxx', function (err, html) {
    var infos = {};
    var istart = html.indexOf('class="titleTop3"');
    var sbody = '';
    if (istart !== -1) {
      istart = html.indexOf('<table', istart);
      if (istart !== -1) {
        var iend = html.indexOf('</table>', istart);
        if (iend !== -1) {
          sbody = html.substring(istart, iend);
        }
      }
    }
    if (!sbody) {
      callback(true);
      return;
    }
    // fuck! there is no </tr> close tag!!
    //<tr.*?>([\s\S]*?)<\/tr>/igm , i+=2
    var spltrs = sbody.split('<tr>');
    if (spltrs) {
      var j = 0;
      for (var i = 1; i < spltrs.length; i++) {
        var spltds = spltrs[i].split(/<td.*?>\s*([\s\S]*?)\s*<\/td>/igm);
        if (!spltds || spltds.length < 8) {
          continue;
        }

        switch (j) {
        case 0:
          infos['id'] = spltds[3];
          infos['name'] = spltds[7];
          break;
        case 2:
          infos['cid'] = spltds[7];
          break;
        case 3:
          if (spltds[3] == '男') {
            infos['gender'] = 1;
          } else if (spltds[3] == '女') {
            infos['gender'] = 2;
          } else {
            infos['gender'] = 0;
          }
          break;
        case 4:
          infos['status'] = spltds[7];
          break;
        case 8:
          infos['highschool'] = spltds[3];
          break;
        case 10:
          infos['address'] = spltds[7];
          break;
        case 11:
          infos['postcode'] = spltds[3];
          break;
        case 12:
          infos['department'] = spltds[7];
          break;
        case 13:
          infos['major'] = spltds[3];
          break;
        case 14:
          infos['grade'] = spltds[3];
          infos['class'] = spltds[7];
          break;
        case 21:
          infos['phone'] = spltds[3];
          break;
        }
        j++;
      }
    }
    callback(null, infos);
  });
};

URPSystem.prototype.getTerms = function (callback) {
  var urptrim = this.trim;
  var parseScore = this.parsescore;
  this.request('/gradeLnAllAction.do?oper=qbinfo', function (err, html) {
    var terms = [];
    var arr = html.split(/<a name="(.+?)" ?\/><\/a>/ig);
    for (var i = 1; i < arr.length; i += 2) {
      var term = {'name': arr[i], 'courses': []};
      var str = arr[i + 1];
      var istart = str.indexOf('class="displayTag"');
      if (istart !== -1) {
        var iend = str.indexOf('</table>', istart);
        if (iend !== -1) {
          str = str.substring(istart, iend);
        } else {
          str = str.substr(istart);
        }
      }
      var splcourses = str.split(/<tr.*?>([\s\S]*?)<\/tr>/igm);
      if (splcourses) {
        //<td.*?>
        for (var j = 1; j < splcourses.length; j += 2) {
          var splcourse = splcourses[j].split(/<td align="center">\s*([\s\S]*?)\s*<\/td>/igm);
          if (!splcourse || splcourse.length < 14) {
            continue;
          }
          var sscore = splcourse[13];
          var m = sscore.match(/<p.*?>(.*?)<\/p>/i);
          if (m) sscore = parseScore(urptrim(m[1]));
          var course = {
            'id': splcourse[1],
            'name': splcourse[5],
            'credit': parseFloat(splcourse[9]),
            'property': splcourse[11],
            'grade': sscore,
          };
          term.courses.push(course);
        }
      }
      terms.push(term);
    }
    callback(null, terms);
  });
};

URPSystem.prototype.getCourses = function (callback) {
  var urptrim = this.trim;
  this.request('/xkAction.do?actionType=6', function (err, html) {
    var courses = [];
    var startFlag = 'class="displayTag"';
    var istart = html.indexOf(startFlag);
    if (istart !== -1) {
      istart = html.indexOf(startFlag, istart + 1);
      if (istart !== -1) {
        var iend = html.indexOf('</table>', istart);
        var str = '';
        if (iend !== -1) {
          str = html.substring(istart, iend);
        } else {
          str = html.substr(istart);
        }
        var splcourses = str.split(/<tr.*?>([\s\S]*?)<\/tr>/igm);
        if (splcourses) {
          var rowspan = 0;
          var course = null;
          for (var j = 1; j < splcourses.length; j += 2) {
            if (rowspan < 0) {
              continue;
            }
            var courseline = false;
            var m = splcourses[j].match(/<td rowspan="([0-9]+)".*?>/i);
            if (m) {
              courseline = true;
              rowspan = parseInt(m[1]);
              course = null;
            }
            var splcourse = splcourses[j].split(/<td.*?>\s*([\s\S]*?)\s*<\/td>/igm);
            if (!splcourse || splcourse.length < 2
                || (courseline && splcourse.length < 37)
                || (!courseline && splcourse.length < 15)) {
              continue;
            }
            for (var k = 1; k < splcourse.length; k += 2) {
              splcourse[k] = urptrim(splcourse[k]);
            }
            rowspan--;
            var timepos = 0;
            if (courseline) {
              var teachers = splcourse[15].split(' ');
              for (var k = 0; k < teachers.length; k++) {
                teachers[k] = urptrim(teachers[k]);
                if (!teachers[k]) {
                  teachers.splice(k, 1);
                  k--;
                }
              }
              course = {
                'plan': splcourse[1],
                'id': splcourse[3],
                'name': splcourse[5],
                'no': parseInt(splcourse[7]),
                'credit': parseFloat(splcourse[9]),
                'property': splcourse[11],
                'teacher': teachers,
                'time': []
              };
              timepos = 22;
            } else if (!course) {
              continue;
            }
            var time = {
              'week': splcourse[timepos + 1],
              'wday': parseInt(splcourse[timepos + 3]),
              'session': parseInt(splcourse[timepos + 5]),
              'class': parseInt(splcourse[timepos + 7]), //hours
              'school': splcourse[timepos + 9],
              'building': splcourse[timepos + 11],
              'room': splcourse[timepos + 13]
            };
            course.time.push(time);
            if (rowspan == 0) {
              courses.push(course);
            }
          }
        }
      }
    }
    callback(null, courses);
  });
};

exports.URPSystem = URPSystem;

}).call(this);
