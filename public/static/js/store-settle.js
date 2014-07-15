// for store-settle
// author: tengattack
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

  var spinner_opts = {
    lines: 9,
    length: 5,
    width: 2,
    radius: 4,
    color: '#fff',
    speed: 1,
    trail: 60,
    shadow: false,
    hwaccel: false,
    className: 'spinner',
    top: '-15px',
    zIndex: 1000
  };

  function checkLogFileExt(fileext) {
    //only support csv
    var log_ext = ['csv'];
    fileext = fileext.toLowerCase();
    if (log_ext.indexOf(fileext) !== -1) {
      return true;
    }
    return false;
  }

  function check_result(result, btn, modal) {
    btn.button('reset');
    if (result.err) {
      var tips = modal.find('#tips.alert-error');
      tips.find('p').text(result.err);
      tips.show();
    } else {
      var tips = modal.find('#tips.alert-success');
      if (result.msg) {
        tips.find('p').text(result.msg);
      }
      tips.show();

      setTimeout(function() {
        modal.modal('hide');

        var table = $('.settle-table');
        var trs = table.find('tbody tr');
        var resstudentid = parseInt(result.studentid);

        trs.each(function(i) {
          var tr = $(trs[i]);
          var studentid = parseInt(tr.find('.user-studentid').text());
          if (studentid === resstudentid) {
            var spanprice = tr.find('.price span');
            var price = parseInt(parseFloat(spanprice.text()) * 100);
            price += parseInt(result.charge);
            if (price >= 0 && !viewall) {
              tr.hide(1000);
            } else {
              spanprice.text((price / 100).toFixed(2));
            }
            return false;
          }
        });
      }, 800);
    }
  }

  function log_import_check_result(result, btn, modal) {
    btn.button('reset');
    if (result.err) {
      var tips = modal.find('#tips.alert-error');
      tips.find('p').text(result.err);
      tips.show();
    } else {
      var tips = modal.find('#tips.alert-success');
      if (result.msg) {
        tips.find('p').text(result.msg);
      }
      tips.show();

      setTimeout(function() {
        modal.modal('hide');
        // change balance
        if (result.reduce_balance) {
          var table = $('.settle-table');
          var trs = table.find('tbody tr');
          var reduce_balance = result.reduce_balance;

          trs.each(function(i) {
            var tr = $(trs[i]);
            var studentid = parseInt(tr.find('.user-studentid').text());

            var total_price = 0;
            for (var j = 0; j < reduce_balance.length; j++) {
              if (reduce_balance[j].studentid === studentid) {
                total_price = reduce_balance[j].total_price;
                break;
              }
            }

            if (total_price > 0) {
              var spanprice = tr.find('.price span');
              var price = parseInt(parseFloat(spanprice.text()) * 100);
              price -= parseInt(total_price);
              spanprice.text((price / 100).toFixed(2));
            }
          });
        }
      }, 800);
    }
  }

  function show_modal(btn, isclear, precharge) {

    var modal = $('#settle_charge_modal');

    if ($('button#settle_charge_submit').hasClass('disabled')) {
      modal.modal();
      return;
    }

    var price = '';

    modal.find('fieldset').removeClass('error');
    modal.find('div#tips').hide();

    if (precharge) {
      modal.find('fieldset#user_realname').hide();
      modal.find('input#user_studentid').prop('disabled', '');
    } else {
      //tr > td > .settle-control > button
      var tr = $(btn).parent().parent().parent();
      var studentid = tr.find('.user-studentid').text();
      var realname = tr.find('.user-realname').text();
      modal.find('fieldset#user_realname').show();
      modal.find('input#user_realname').val(realname);
      modal.find('input#user_studentid').val(studentid);
      if (isclear) {
        var valprice = parseFloat(tr.find('.price span').text());
        if (valprice >= 0) {
          return;
        }
        price = Math.abs(valprice).toFixed(2);
      }
    }

    modal.find('input#settle_charge').val(price);
    modal.modal();
  }
  
  $('button#settle_clear').click(function () {
    show_modal(this, true);
    return false;
  });

  $('button#settle_charge').click(function () {
    show_modal(this);
    return false;
  });

  $('button#settle_precharge').click(function () {
    show_modal(this, false, true);
  });

  $('button#purchase_log_import').click(function () {
    var modal = $('#log_import_modal');

    if ($('button#log_import_submit').hasClass('disabled')) {
      modal.modal();
      return;
    }

    modal.find('fieldset').removeClass('error');
    modal.find('div#tips').hide();
    modal.find('div#error_format_tips').hide();

    modal.find('input#log_file').val('');
    modal.find('span#log_file_path').text('');

    modal.modal();
  });

  $('button#log_import_submit').click(function () {
    var modal = $('#log_import_modal');

    if (!modal.find('input#log_file').val()) {
      return false;
    }

    var btn = $(this);
    var spinner = new Spinner(spinner_opts).spin();
    btn.button('loading');
    btn.append(spinner.el);

    $('#log_import_form').ajaxSubmit({
      contentType: 'application/x-www-form-urlencoded; charset=utf-8',
      dataType: 'json',
      success: function(data) {
        log_import_check_result(data, btn, modal);
      },  
      error: function() {  
        log_import_check_result(null, btn, modal);  
      }
    });
    return false;
  });

  $('button.uploader-button').click(function () {
    $('#' + $(this).attr('id') + '_file').click();
  });

  $('button#settle_charge_submit').click(function () {
    var modal = $('#settle_charge_modal');
    var valprice = modal.find('input#settle_charge').val();
    var studentid = modal.find('input#user_studentid').val();
    var price = valprice ? parseInt(parseFloat(valprice) * 100) : 0;

    var haveerror = false;

    if (!(studentid && isNumeric(studentid))) {
      modal.find('fieldset#user_studentid').addClass('error');
      haveerror = true;
    }
    if (price <= 0) {
      modal.find('fieldset#settle_charge').addClass('error');
      haveerror = true;
    }
    if (!haveerror) {
      var btn = $(this);
      var csrf = modal.find('input#csrf').val();
      
      var spinner = new Spinner(spinner_opts).spin();
      btn.button('loading');
      btn.append(spinner.el);

      var objcharge = {
        csrf: csrf,
        studentid: studentid,
        charge: price,
        action: 'charge'
      };
      $.ajax({
        type: 'POST',
        url: '/store/settle?ajax=1',
        dataType: 'json',
        data: objcharge,
        success: function (msg) {
          check_result(msg, btn, modal);
        },
        error: function () {
          check_result(null, btn, modal);
        }
      });
    }
    return false;
  });

  $('.file-input').change(function () {
    var file_obj = $(this);
    var path = file_obj.val();
    var filename = getFileName(path);
    if (!checkLogFileExt(getFileNameExt(filename))) {
      file_obj.val('');
      filename = '';
      if (path) {
        // not cancel
        $('#error_format_tips').show();
      }
    } else {
      $('#error_format_tips').hide();
    }
    var file_path_obj = $('#' + $(this).attr('id') + '_path');
    if (filename) {
      file_path_obj.text(filename);
    } else {
      file_path_obj.text('');
    }
  });

}(window.jQuery);
