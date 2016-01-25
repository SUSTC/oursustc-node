
function check_edit() {
  return check_form($('#topic_edit_form'));
}

function check_add() {
  return check_form($('#topic_add_form'));
}

function check_form(form) {
  var checkFields = ['.field#title', '.field#content'];
  var checkThings = ['input', 'textarea'];
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

var uploading = false;
function beforeSendHandler() {
  uploading = true;
  $('#topic_attachment_add').addClass('disabled').prop('disabled', true);
}

function successHandler(data) {
  if (data) {
    var uiMessage = $('#attachment_errmsg');
    if (data.err && data.err.msg) {
      uiMessage.find('.errmsg').html(data.err.msg);
      uiMessage.show();
    } else {
      uiMessage.hide();

      $('#attachment_list').append('\
        <div class="item">\
          <div class="ui image label" href="/file/' + data.file.id + '" target="_blank">' + htmlspecialchars(data.file.name) + '<i class="delete icon" onclick="$(this).parent().parent().remove();"></i></div>\
          <input type="hidden" name="topic[attachment][]" value="' + data.file.id + '" />\
        </div>'
      );
    }
  }
}

function completeHandler() {
  uploading = false;
  $('#topic_attachment_add').removeClass('disabled').prop('disabled', false);
}

function errorHandler() {
  var uiMessage = $('#attachment_errmsg');
  //TODO: move to page
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
    var formData = new FormData($('#attachment_form')[0]);
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

$('#attachment_file').change(readyToUpload);
$('#topic_attachment_add').click(function () {
  if (uploading) {
    return;
  }
  $('#attachment_file').click();
});
