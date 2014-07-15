
var Pagedown = require("pagedown");
var Extra = require("./Markdown.Extra").Extra;
var bindMathJaxHooks = require("./mathJax").bindMathJaxHooks;

exports.Markdown = function (text) {

  var safeConverter = Pagedown.getSanitizingConverter();

  // tell the converter to use Markdown Extra for tables, fenced_code_gfm, def_list
  Extra.init(safeConverter, {extensions: ["tables", "fenced_code_gfm", "def_list"], highlighter: "prettify"});

  // for latex
  bindMathJaxHooks(safeConverter);

  // add delete line
  safeConverter.hooks.chain("preSpanGamut", function (text) {
    return text.replace(/([\W_]|^)(-)(?=\S)([^\r\*_]*?\S)\2([\W_]|$)/g,
      "$1<del>$3</del>$4");
  });

  return safeConverter.makeHtml(text);
};
