
(function() {

    var crypto = require('crypto');

    exports.md5 = function(str, raw_output) {
        var hash = crypto.createHash('md5');
        if (raw_output) {
            return hash.update(str).digest('binary');
        } else {
            return hash.update(str).digest('hex');
        }
    }

    exports.base64_encode = function(str) {
        return new Buffer(str).toString('base64');
    };

    exports.base64_decode = function(base64str) {
        return new Buffer(base64str, 'base64').toString();
    };

    //length为生成字符串的长度
    exports.random = function(length) {
        var basestr = "abcdefghijklmnopqrstuvwxyz0123456789";
        var randomstr = "";
        for (var i = 0; i < length; i++) {
            randomstr += basestr.charAt(Math.ceil(Math.random() * 100000000) % basestr.length);
        }
        return randomstr;   
    };

    exports.is_numeric = function(str) {
        var numpattern = /^[0-9]+$/;
        return numpattern.test(str);
    };

    exports.is_hexnumeric = function(str) {
        var numpattern = /^[0-9a-z]+$/;
        return numpattern.test(str);
    };

    exports.is_objectid = function(str) {
        str = String(str);
        return ((str.length === 24) && exports.is_hexnumeric(str));
    };

    exports.is_date = function(str) {
        var pattern = /^[0-9]{4}([\-|\/][0-9]{1,2}){2}$/;
        return pattern.test(str);
    };

    function preg_quote(str, delimiter) {
      //  discuss at: http://phpjs.org/functions/preg_quote/
      // original by: booeyOH
      // improved by: Ates Goral (http://magnetiq.com)
      // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // improved by: Brett Zamir (http://brett-zamir.me)
      // bugfixed by: Onno Marsman
      //   example 1: preg_quote("$40");
      //   returns 1: '\\$40'
      //   example 2: preg_quote("*RRRING* Hello?");
      //   returns 2: '\\*RRRING\\* Hello\\?'
      //   example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
      //   returns 3: '\\\\\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:'

      return String(str)
        .replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    }

    exports.preg_quote = preg_quote;

    exports.format = function() {
        if(arguments.length == 0)
            return null;

        var str = arguments[0]; 
        for (var i = 1; i < arguments.length; i++) {
            var re = new RegExp('\\{' + (i-1) + '\\}','gm');
            str = str.replace(re, arguments[i]);
        }
        return str;
    };

    exports.price_format = function(price) {
        var priceYuan = Math.round(parseInt(price)) / 100;
        return priceYuan.toFixed(2).toString();
    };

    exports.format_date = function (date, friendly) {
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var hour = date.getHours();
      var minute = date.getMinutes();
      var second = date.getSeconds();

      var now = new Date();

      if (friendly) {
        var mseconds = -(date.getTime() - now.getTime());
        var time_std = [ 1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000 ];
        if (mseconds < time_std[4]) {
          if (mseconds > 0 && mseconds < time_std[1]) {
            return Math.floor(mseconds / time_std[0]).toString() + ' 秒前';
          }
          if (mseconds >= time_std[1] && mseconds < time_std[2]) {
            return Math.floor(mseconds / time_std[1]).toString() + ' 分钟前';
          }
          if (mseconds >= time_std[2] && mseconds < time_std[3]) {
            return Math.floor(mseconds / time_std[2]).toString() + ' 小时前';
          }
          if (mseconds >= time_std[3]) {
            return Math.floor(mseconds / time_std[3]).toString() + ' 天前';
          }
        }
      }

      //month = ((month < 10) ? '0' : '') + month;
      //day = ((day < 10) ? '0' : '') + day;
      hour = ((hour < 10) ? '0' : '') + hour;
      minute = ((minute < 10) ? '0' : '') + minute;
      second = ((second < 10) ? '0': '') + second;

      var thisYear = now.getFullYear();
      year = (thisYear === year) ? '' : (year + '/');
      return year + month + '/' + day + ' ' + hour + ':' + minute;
    };

    exports.clean = function(str) {
        return str.toLowerCase();
    };

    exports.trim = function (str) {  
      return str.replace(/(^\s*)|(\s*$)/g, "");  
    };

}).call(this);
