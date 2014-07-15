
function check_reply() {
  var form = $('form#topic_reply_form');
  var checkFields = ['.field#reply_text'];
  var checkThings = ['textarea'];
  var checkPass = true;

  $.each(checkFields, function (i, value) {
    var field = form.find(value);
    var input = field.find(checkThings[i]);

    if (!input.val()) {
      field.addClass('error');
      checkPass = false;
    } else {
      field.removeClass('error');
    }

  });

  if (checkPass) {
    form.submit();
  }
}

function initContent() {
  $('.prettyprint').each(function(){
    $(this).addClass('linenums');
  });
  prettyPrint(); // print code syntax for code snippet if there is.

  $('table').each(function() {
    $(this).addClass('ui table segment');
  });

  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "wmd-preview"]);
}

initContent();