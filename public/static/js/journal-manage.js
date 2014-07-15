// for term-manage
// author: tengattack
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

  var MATCH = {
    INPUT_TERM: "input[name='term[]']",
    INPUT_TERM_NAME: "input#term_name",
    BUTTON_INFO_SUBMIT: "button#term_info_submit",
    MODAL_INFO: "#term_info_modal",
    FORM_LIST: "form#term_list_form"
  };

  function list_get_select_count() {
    var form = $(MATCH.FORM_LIST);
    var p = form.find(MATCH.INPUT_TERM);
    var check_count = 0;
    for (var i = 0; i < p.length; i++) {
      if ($(p[i]).prop('checked') === true) {
        check_count++;
      }
    }
    return check_count;
  }

  function list_form_submit(action) {
    if (list_get_select_count() > 0) {
      var form = $(MATCH.FORM_LIST);
      form.find("input[name='action']").val(action);
      form.submit();
    } else {
      $('#need_select').show();
    }
  }

  function show_modal(btn, isupdate) {

    var modal = $(MATCH.MODAL_INFO);

    if ($(MATCH.BUTTON_INFO_SUBMIT).hasClass('disabled')) {
      modal.modal();
      return;
    }

    modal.find('fieldset').removeClass('error');
    modal.find('div#error_image_tips').hide();
    modal.find('.file-input').val('');
    modal.find('span.file-path').text('');

    var action = 'add';
    var cover_url = '/static/img/journal/def-term-cover.png';
    var term_id = 0;
    var term_name = '';
    var description = '';
    var stock = 0;

    if (isupdate) {
      modal.find(MATCH.BUTTON_INFO_SUBMIT).button('term_update');
      //tr > td > .settle-control > button
      var tr = $(btn).parent().parent().parent();
      
      action = 'update';
      cover_url = tr.find('.journal-image img').attr('src');
      term_id = parseInt(tr.find(MATCH.INPUT_TERM).val());
      term_name = tr.find('.journal-info .name').text();

      price = tr.find('.price span').text();
      description = tr.find('.journal-info .description').text();

    } else {
      modal.find(MATCH.BUTTON_INFO_SUBMIT).button('reset');
    }

    modal.find("input[name='action']").val(action);
    modal.find('img#term_cover').attr('src', cover_url);
    modal.find("input[name='term[id]']").val(term_id.toString());
    modal.find(MATCH.INPUT_TERM_NAME).val(term_name);
    modal.find('textarea#term_description').text(description);

    modal.modal();
  }

  $('button#term_update').click(function () {
    show_modal(this, true);
    return false;
  });

  $('button#term_add').click(function () {
    show_modal(this);
  });

  $('button.uploader-button').click(function () {
    $('#' + $(this).attr('id') + '_file').click();
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
    } else {
      file_path_obj.text('');
    }
  });

  $('a#term_set_public').click(function () {
    list_form_submit('set_public');
  });

  $('a#term_set_private').click(function () {
    list_form_submit('set_private');
  });

  $('a#term_delete_submit').click(function () {
    list_form_submit('delete');
  });

  $('button#term_delete').click(function () {
    $('#widget .alert').hide();
    if (list_get_select_count() > 0) {
      $('#confirm_delete').show();
    } else {
      $('#need_select').show();
    }
    return false;
  });

  $("input#select_all").click(function() {
    $('#widget .alert').hide();
    if ($(this).prop('checked') === true) { //check all
      $(MATCH.INPUT_TERM).each(function() {
        $(this).prop('checked', true);
      });
    } else {
      $(MATCH.INPUT_TERM).each(function() {
        $(this).prop('checked', false);
      });
    }
  });

  $(MATCH.BUTTON_INFO_SUBMIT).click(function () {
    var modal = $(MATCH.MODAL_INFO);
    var term_name = modal.find('input#term_name').val();

    var haveerror = false;

    if (!term_name) {
      modal.find('fieldset#term_name').addClass('error');
      haveerror = true;
    }
    if (!haveerror) {
      modal.find('form').submit();
    }
    return false;
  });

}(window.jQuery);
