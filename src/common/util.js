var fs = require('fs');
var xss = require('xss');
var string = require('./string');

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr) && !(obj[attr] instanceof Function)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    return undefined;
    //throw new Error("Unable to copy obj! Its type isn't supported.");
}

exports.clone = clone;

exports.format_date = string.format_date;

exports.lineSplit = function (file, callback) {
  var filedata = fs.readFileSync(file, 'utf8');
  if (filedata) {
    filedata = filedata.replace(/\r/g, '');
    var strproducts = filedata.split('\n');
    for (var i = 0; i < strproducts.length; i++) {
      // 移除空行和注释行
      if (strproducts[i] && strproducts[i].substr(0, 1) !== '#') {
        callback(strproducts[i]);
      }
    }
  }
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function (html) {
  var codeSpan = /(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm;
  var codeBlock = /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g;
  var spans = [];
  var blocks = [];
  var text = String(html).replace(/\r\n/g, '\n')
  .replace('/\r/g', '\n');

  text = '\n\n' + text + '\n\n';

  text = text.replace(codeSpan, function (code) {
    spans.push(code);
    return '`span`';
  });

  text += '~0';

  return text.replace(codeBlock, function (whole, code, nextChar) {
    blocks.push(code);
    return '\n\tblock' + nextChar;
  })
  .replace(/&(?!\w+;)/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/`span`/g, function () {
    return spans.shift();
  })
  .replace(/\n\tblock/g, function () {
    return blocks.shift();
  })
  .replace(/~0$/, '')
  .replace(/^\n\n/, '')
  .replace(/\n\n$/, '');
};

/**
 * XSS模块配置
 */
var xssOptions = {
  whiteList: {
    h1:     [],
    h2:     [],
    h3:     [],
    h4:     [],
    h5:     [],
    h6:     [],
    hr:     [],
    span:   [],
    strong: [],
    b:      [],
    i:      [],
    br:     [],
    p:      [],
    pre:    ['class'],
    code:   [],
    a:      ['target', 'href', 'title'],
    img:    ['src', 'alt', 'title'],
    div:    [],
    table:  ['width', 'border'],
    tr:     [],
    td:     ['width', 'colspan'],
    th:     ['width', 'colspan'],
    tbody:  [],
    thead:  [],
    ul:     [],
    li:     [],
    ol:     [],
    dl:     [],
    dt:     [],
    em:     [],
    cite:   [],
    section: [],
    header: [],
    footer: [],
    blockquote: [],
    audio:  ['autoplay', 'controls', 'loop', 'preload', 'src'],
    video:  ['autoplay', 'controls', 'loop', 'preload', 'src', 'height', 'width']
  }
};

/**
 * 过滤XSS攻击代码
 *
 * @param {string} html
 * @return {string}
 */
exports.xss = function (html) {
  return xss(html, xssOptions);
};
