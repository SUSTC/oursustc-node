
new function($) {
  $.fn.setCursorPosition = function(pos) {
    if ($(this).get(0).setSelectionRange) {
      $(this).get(0).setSelectionRange(pos, pos);
    } else if ($(this).get(0).createTextRange) {
      var range = $(this).get(0).createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
    $(this).focus();
  }
  $.fn.tabHandler = function() {
    $(this).keydown(function(e) {
        if(e.keyCode === 9) { // tab was pressed
            // get caret position/selection
            var start = this.selectionStart;
            var end = this.selectionEnd;

            var $this = $(this);
            var value = $this.val();

            // set textarea value to: text before caret + four spaces + text after caret
            $this.val(value.substring(0, start)
                        + "    "
                        + value.substring(end));

            // put caret at right position again (add four for the spaces)
            this.selectionStart = this.selectionEnd = start + 4;

            // prevent the focus lose
            e.preventDefault();
        }
    });
  }
}(jQuery);

function setEditorMode(mode) {
  var editorMode = $('#editor-mode .item');
  if (mode == 'preview') {
    $('#wmd-wrapper').hide();
    $('#wmd-preview').show();
    $(editorMode.get(0)).removeClass('active');
    $(editorMode.get(1)).addClass('active');
  } else {
    $('#wmd-preview').hide();
    $('#wmd-wrapper').show();
    $(editorMode.get(0)).addClass('active');
    $(editorMode.get(1)).removeClass('active');
  }
}

(function () {
    // handle Tab keystroke
    $('#wmd-input').tabHandler();

    var converter1 = Markdown.getSanitizingConverter();

    // tell the converter to use Markdown Extra for tables, fenced_code_gfm, def_list
    Markdown.Extra.init(converter1, {extensions: ["tables", "fenced_code_gfm", "def_list"], highlighter: "prettify"});

    // To handle LaTeX expressions, to avoid the expression fail to work because of markdown syntax. inspired by stackeditor
    // This will handle $$LaTeX expression$$ only, so that $LaTeX expression$ could fail to handle either.
    bindMathJaxHooks(converter1);

    // add delete line
    converter1.hooks.chain("preSpanGamut", function (text) {
        return text.replace(/([\W_]|^)(-)(?=\S)([^\r\*_]*?\S)\2([\W_]|$)/g,
            "$1<del>$3</del>$4");
    });

    var options = {
        //helpButton: { handler: markdownHelp },
        strings: Markdown.local.zh
    };

    var editor1 = new Markdown.Editor(converter1, null, options);

    editor1.hooks.chain("onPreviewRefresh", function () {

      $('.prettyprint').each(function(){
          $(this).addClass('linenums');
      });
      prettyPrint(); // print code syntax for code snippet if there is.

      /*if ($('body').hasClass('theme-white'))*/ {
          $('table').each(function() {
              //table table-striped-white table-bordered
              $(this).addClass('ui table segment');
          });
      } /*else {
          $('table').each(function() {
              $(this).addClass('table table-striped-black table-bordered');
          });
      }*/

      MathJax.Hub.Queue(["Typeset", MathJax.Hub, "wmd-preview"]);
      //MathJax.Hub.Queue(tryFinished);
    });

    editor1.run();
    $('#wmd-button-row')
      .addClass('ui small icon menu')
      .find('li').addClass('item').attr('style', '');

    $('#wmd-bold-button > span').append('<i class="bold icon"></i>');
    $('#wmd-italic-button > span').append('<i class="italic icon"></i>');
    $('#wmd-link-button > span').append('<i class="url icon"></i>');
    $('#wmd-quote-button > span').append('<i class="quote left icon"></i>');
    $('#wmd-code-button > span').append('<i class="code icon"></i>');
    $('#wmd-image-button > span').append('<i class="photo icon"></i>');
    $('#wmd-olist-button > span').append('<i class="ordered list icon"></i>');
    $('#wmd-ulist-button > span').append('<i class="list icon"></i>');
    $('#wmd-heading-button > span').append('<i class="browser icon"></i>');
    $('#wmd-hr-button > span').append('<i class="minus icon"></i>');
    $('#wmd-undo-button > span').append('<i class="undo icon"></i>');
    $('#wmd-redo-button > span').append('<i class="repeat icon"></i>');
    $('#wmd-help-button > span').append('<i class="help icon"></i>');

    function popupEditorDialog(title, body, imageClass, placeholder) {
      $('#editorDialog').find('.modal-body input').val("");
      $('#editorDialog').find('.modal-body input').attr("placeholder", placeholder);
      $('#editorDialog').find('#editorDialog-title').text(title);
      $('#editorDialog').find('.modal-body p').text(body);
      $('#editorDialog').find('.modal-body i').removeClass().addClass(imageClass);
      $('#editorDialog').modal({keyboard : true});
    }

     // Custom insert link dialog
    editor1.hooks.set("insertLinkDialog", function(callback) {
        $('#editor-link-dialog')
          .modal('setting', {
            'transition': 'horizontal flip',
            onShow: function() {
              $(this).find('#editor_link').val('');
            },
            onDeny: function() {
              callback(null);
            },
            onApprove: function() {
              callback($(this).find('#editor_link').val());
            }
          })
          .modal('show')
        ;
        return true; // tell the editor that we'll take care of getting the link url
    });

    // Custom insert image dialog
    var editorDialogCallback = null;
    editor1.hooks.set("insertImageDialog", function(callback) {
        $('#editor-image-dialog')
          .modal('setting', {
            'transition': 'horizontal flip',
            onDeny: function() {
              callback(null);
            },
            onApprove: function() {
              var image_url = $('#editor_image_url').val();
              callback(image_url);
            }
          })
          .modal('show')
        ;
        return true; // tell the editor that we'll take care of getting the image url
    });

})();

(function () {

function beforeSendHandler() {
  uploading = true;
  $('#editor_image_upload').addClass('disabled').prop('disabled', true);
}

function successHandler(data) {
  if (data) {
    var uiMessage = $('#editor_image_errmsg');
    if (data.err && data.err.msg) {
      uiMessage.find('.errmsg').html(data.err.msg);
      uiMessage.show();
    } else {
      uiMessage.hide();
      $('#editor_image_url').val('/file/' + data.file.id);
    }
  }
}

function completeHandler() {
  uploading = false;
  $('#editor_image_upload').removeClass('disabled').prop('disabled', false);
}

function errorHandler() {
  var uiMessage = $('#editor_image_errmsg');
  uiMessage.find('.errmsg').html("#{lang.errmsg.upload_failed}");
  uiMessage.show();
}

function progressHandlingFunction(e) {
  /*if (e.lengthComputable) {
    $('progress').attr({value:e.loaded,max:e.total});
  }*/
}

function readyToUpload() {
  if (this.files && this.files.length > 0) {
    var formData = new FormData($('#editor_image_upload_form')[0]);
    $.ajax({
        url: '/file/upload',  //server script to process data
        type: 'POST',
        xhr: function () {  // custom xhr
            myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) { // check if upload property exists
                myXhr.upload.addEventListener('progress', progressHandlingFunction, false); // for handling the progress of the upload
            }
            return myXhr;
        },
        //Ajax事件
        beforeSend: beforeSendHandler,
        success: successHandler,
        error: errorHandler,
        complete: completeHandler,
        // Form数据
        data: formData,
        dataType: 'json',
        //Options to tell JQuery not to process data or worry about content-type
        cache: false,
        contentType: false,
        processData: false
    });
  }
}

  var uform = $('#editor_image_upload_form');
  $('body').append('<form id="editor_image_upload_form" style="display:none">'
    + uform.html()
    + '</form>');
  uform.remove();

  $('#editor_image_upload').click(function () {
    if (uploading) {
      return;
    }
    $('#editor_image_file').click();
  });

  $('#editor_image_file').change(function () {
    var file_obj = $(this);
    var path = file_obj.val();
    var filename = getFileName(path);
    if (!checkImageFileExt(getFileNameExt(filename))) {
      file_obj.val('');
      filename = '';
      if (path) {
        // not cancel
        $('#editor_error_image_tips').show();
      }
    } else {
      $('#editor_error_image_tips').hide();
      readyToUpload.call(this);
    }
  });

})();