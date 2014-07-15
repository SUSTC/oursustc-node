// for store-settle
// author: tengattack
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

  var MATCH = {
    INPUT_PRODUCT: "input[name='product[]']",
    INPUT_PRODUCT_NAME: "input#product_name",
    BUTTON_INFO_SUBMIT: "button#product_info_submit",
    MODAL_INFO: "#product_info_modal",
    FORM_LIST: "form#product_list_form"
  };

  function list_get_select_count() {
    var form = $(MATCH.FORM_LIST);
    var p = form.find(MATCH.INPUT_PRODUCT);
    var check_count = 0;
    for (var i = 0; i < p.length; i++) {
      if ($(p[i]).prop('checked') === true) {
        check_count++;
      }
    }
    return check_count;
  }

  function list_form_submit(action, amount) {
    if (list_get_select_count() > 0) {
      var form = $(MATCH.FORM_LIST);
      form.find("input[name='action']").val(action);
      if (amount) {
        form.find("input[name='amount']").val(amount.toString());
      }
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
    var preview_url = '/static/img/store/def-product-preview.png';
    var product_id = 0;
    var product_name = '';
    var price = '';
    var description = '';
    var stock = 0;

    if (isupdate) {
      modal.find(MATCH.BUTTON_INFO_SUBMIT).button('product_update');
      //tr > td > .settle-control > button
      var tr = $(btn).parent().parent().parent();
      
      action = 'update';
      preview_url = tr.find('.product-view img').attr('src');
      product_id = parseInt(tr.find(MATCH.INPUT_PRODUCT).val());
      product_name = tr.find('.product-name').text();

      price = tr.find('.price span').text();
      description = tr.find('.product-description').text();

      stock = tr.find('.product-stock').text();
    } else {
      modal.find(MATCH.BUTTON_INFO_SUBMIT).button('reset');
    }

    modal.find("input[name='action']").val(action);
    modal.find('img#product_preview').attr('src', preview_url);
    modal.find("input[name='product[id]']").val(product_id.toString());
    modal.find(MATCH.INPUT_PRODUCT_NAME).val(product_name);
    modal.find('input#product_price').val(price);
    modal.find('textarea#product_description').text(description);
    modal.find('input#product_stock').val(stock.toString());

    modal.modal();
  }

  $('button#product_update').click(function () {
    show_modal(this, true);
    return false;
  });

  $('button#product_add').click(function () {
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

  $('button#product_remove').click(function () {
    list_form_submit('remove');
    return false;
  });

  $('a#product_ready').click(function () {
    list_form_submit('ready');
  });

  $('a#change_stock_submit').click(function () {
    list_form_submit('stock');
  });

  $('a#product_delete_submit').click(function () {
    list_form_submit('delete');
  });

  $('a#product_delete').click(function () {
    $('#widget .alert').hide();
    if (list_get_select_count() > 0) {
      $('#confirm_delete').show();
    } else {
      $('#need_select').show();
    }
  });

  $('a#change_stock').click(function () {
    $('#widget .alert').hide();
    if (list_get_select_count() > 0) {
      $('#change_stock_widget').show();
    } else {
      $('#need_select').show();
    }
  });

  $("input#select_all").click(function() {
    $('#widget .alert').hide();
    if ($(this).prop('checked') === true) { //check all
      $(MATCH.INPUT_PRODUCT).each(function() {
        $(this).prop('checked', true);
      });
    } else {
      $(MATCH.INPUT_PRODUCT).each(function() {
        $(this).prop('checked', false);
      });
    }
  });

  $(MATCH.BUTTON_INFO_SUBMIT).click(function () {
    var modal = $(MATCH.MODAL_INFO);
    var valprice = modal.find('input#product_price').val();
    var product_name = modal.find('input#product_name').val();
    var price = valprice ? parseInt(parseFloat(valprice) * 100) : 0;

    var haveerror = false;

    if (!product_name) {
      modal.find('fieldset#product_name').addClass('error');
      haveerror = true;
    }
    if (price <= 0) {
      modal.find('fieldset#product_price').addClass('error');
      haveerror = true;
    }
    if (!haveerror) {
      modal.find('form').submit();
    }
    return false;
  });

}(window.jQuery);
