
function htmlencode(str) {
  return String(str)
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

function htmlencode_extra(str) {
  return String(str)
          .replace(/\n/g, '<br>')
          .replace(/\r/g, '');
}

function escape(str) {
  return String(str)
          .replace(/"/g, "\\\"")
          .replace(/'/g, "\\'");
};

function unescape(str) {
  return String(str)
          .replace(/\\\"/g, "\"")
          .replace(/\\'/g, "'");
};