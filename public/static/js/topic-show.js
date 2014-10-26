
function topic_set(topic_id, sets, csrf) {
  var topic = {
    id: topic_id,
  };
  for (var key in sets) {
    topic[key] = sets[key];
  }
  $.ajax({
    type: "POST",
    url: '/topic/set',
    data: {topic: topic, csrf: csrf},
    success: function (data) {
      if (data && !data.err) {
        window.location.reload();
      }
    },
    dataType: 'json',
  });
}

function expand_replies(topic_id) {
  var btn = $('#expand_replies_btn');
  if (btn.hasClass('loading')) {
    return;
  }
  btn.addClass('loading');
  $.ajax({
    type: "GET",
    url: '/topic/' + topic_id + '?full=1',
    success: function (html) {
      btn.removeClass('loading');
      if (!html) {
        //alert(data.err);
        return;
      }
      var reply_list_el = $(html).find('#reply_list');
      if (reply_list_el && reply_list_el.length) {
        $('#reply_list').after(reply_list_el).remove();
        initPage(false);

        var reply_count = reply_list_el.find('> .reply').length;
        btn.find('.reply_count').text(reply_count.toString());

        $('#fold_replies_btn').show();
      }
      btn.removeClass('loading').hide();
    },
    error: function () {
      btn.removeClass('loading');
    },
  });
}

function fold_replies() {
  $('#fold_replies_btn').hide();

  //'> .reply:lt()' Maybe can use lt selectors
  var reply_els = $('#reply_list').find('> .reply');
  if (reply_els.length > 10) {
    for (var i = 0; i < reply_els.length - 10; i++) {
      $(reply_els[i]).remove();
    }
  }

  $('#expand_replies_btn').show();
}

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

function reply_edit(btnel, rid) {
  var form = $(btnel).parents('form');
  var checkFields = ['.field'];
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
    var csrf = form.find('input[name=csrf]').val();
    var content = form.find('textarea').val();
    var data = {
      csrf: csrf,
      reply: {
        id: rid,
        content: content,
      },
    };

    var ro = $(form).parents('.reply');
    form.remove();
    var rc = ro.find('.reply-content');
    rc.show();

    $.ajax({
      type: "POST",
      url: '/topic/reply/edit',
      data: data,
      success: function (data) {
        rc.find('.dimmer').remove();
        if (!data || data.err) {
          //alert(data.err);
          return;
        }
        rc.html(data.reply.content);
      },
      dataType: 'json',
    });
  }
  return false;
}

function reply_edit_cancel(btnel, rid) {
  var form = $(btnel).parents('form');
  var ro = $(form).parents('.reply');
  var rc = ro.find('.reply-content');

  form.remove();
  
  rc.find('.dimmer').remove();
  rc.show();
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

function initTools() {
  $('.reply-quote').click(function () {
    var ro = $(this).parents('.reply');
    var username = ro.find('.user-name a').text();
    var rc = ro.find('.reply-content');
    var gettext = function (rc, depth) {
      var childs = $(rc).find('> *');
      console.log(childs);
      var quotetext = '';
      var strquoteprefix = '';
      if (depth == undefined) {
        depth = 1;
      }
      for (var i = 0; i < depth; i++) {
        strquoteprefix += '>';
      }
      strquoteprefix += ' ';
      for (var i = 0; i < childs.length; i++) {
        var child = childs[i];
        var tagName = child.tagName.toLowerCase();
        if (tagName == 'p') {
          quotetext += strquoteprefix + $(child).text() + '\n'
            + strquoteprefix + '\n';
        } else if (tagName == 'blockquote') {
          var bqtext = gettext(child, depth + 1);
          if (bqtext) {
            bqtext += strquoteprefix + '\n';
          }
          quotetext += bqtext;
        }
      };
      return quotetext;
    };

    var content = gettext(rc);
    if (username && content) {
      content = '> @' + username + ' :\n> \n' + content + '\n';
      var trto = $("#topic_reply_text");
      var text = trto.val();
      if (text) {
        text += '\n\n' + content;
      } else {
        text = content;
      }
      trto.focus().val('').val(text);
    }
  });
  $('.reply-edit').click(function () {
    var ro = $(this).parents('.reply');
    var eform = ro.find('form');
    if (eform && eform.length > 0) {
      eform.find('textarea').focus();
      return;
    }

    var rc = ro.find('.reply-content');
    //var re = ro.find('.reply-editor');
    rc.prepend('<div class="ui active inverted dimmer"> \
  <div class="ui text loader">Loading</div> \
</div>');
    var rid = ro.attr('id');
    $.get('/topic/reply/' + rid, function (data) {
      var r;
      try {
        r = JSON.parse(data);
      } catch (e) {
      }
      if (!r || r.err) {
        rc.find('.dimmer').remove();
        return;
      }

      rc.hide();
      ro.append('<form id="topic_reply_edit_form_' + rid + '" class="ui form" method="POST" action="/topic/reply/edit"> \
      <div style="display:none">\
        <input type="hidden" name="csrf" value="' + r.csrf + '">\
        <input type="hidden" name="reply[id]" value="' + rid + '">\
      </div>\
      <div class="field">\
        <textarea id="topic_reply_edit_text_' + rid + '" name="reply[content]"></textarea>\
      </div>\
      <div class="form-actions">\
        <button type="button" onclick="reply_edit(this, \'' + rid + '\');" class="ui blue submit button">保存</button>\
        <button type="button" onclick="reply_edit_cancel(this, \'' + rid + '\');" class="ui blue submit button">取消</button>\
      </div>\
    </form>');
      ro.find('form .field textarea').val(r.reply.content).focus();
    });
  });
}

function initPage(checkHash) {
  if (checkHash) {
    var urlHash = window.location.hash;
    //like #54415df9344c392819000032
    if (urlHash && urlHash.length == 25) {
      var replyS = $(urlHash);
      if (replyS && replyS.length <= 0) {
        //click expand
        $('#expand_replies_btn').click();
      }
    }
  }
  initContent();
  initTools();
}

initPage(true);