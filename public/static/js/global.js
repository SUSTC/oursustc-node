/*!
* global.js for sustc.us
* Copyright 2013 tengattack
*/

function htmlspecialchars(str) {
  if (typeof(str) == "string") {
    /* must do &amp; first */
    str = str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  return str;
}

function getFileName(path) {
  var pos = path.lastIndexOf("\\");
  if (pos === -1) {
    pos = path.lastIndexOf("/");
  }
  return path.substring(pos + 1);  
}

function getFileNameExt(filename) {
  var pos = filename.lastIndexOf(".");
  if (pos === -1) {
    return '';
  }
  return filename.substring(pos + 1);  
}

function checkImageFileExt(fileext) {
  var support_image_fileext = [
    'jpg', 'png', 'jpeg', 'bmp', 'gif', 'webp'
  ];
  return (support_image_fileext.indexOf(fileext.toLowerCase()) !== -1);
}

function isNumeric(str) {
  var numpattern = /^[0-9]+$/;
  return numpattern.test(str);
}
