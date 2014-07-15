// for user-config
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

  function enableSaveButton() {
    $('button#config_save').removeAttr('disabled').removeClass('disabled');
  }

  $('button.uploader-button').click(function () {
    $('#' + $(this).attr('id') + '_file').click();
  });

  $('#user_config_form input').change(function () {
    enableSaveButton();
  });

  $('#user_config_form textarea').change(function () {
    enableSaveButton();
  });

  $('.file-input').change(function () {
    var file_obj = $(this);
    var path = file_obj.val();
    var filename = getFileName(path);
    if (!checkImageFileExt(getFileNameExt(filename))) {
      file_obj.val('');
      filename = '';
      if (path) {
        // not cancel
        $('#error_image_tips').show();
      }
    } else {
      $('#error_image_tips').hide();
    }
    var file_path_obj = $('#' + $(this).attr('id') + '_path');
    if (filename) {
      file_path_obj.text(filename);
      enableSaveButton();
    } else {
      file_path_obj.text('');
    }
  });

}(window.jQuery);
