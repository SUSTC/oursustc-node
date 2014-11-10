
function show_page_card(linkel, cardelid, page_id) {

  linkel = $(linkel);
  var isenter = false, isbindleave = false;

  //setTimeout(function () {

  var popel = $('#' + cardelid).parent();
  if (!popel || popel.length <= 0) {
    return;
  }

  popel.mouseenter(function () {
    isenter = true;
    if (!isbindleave) {
      popel.mouseleave(function () {
        isenter = false;
        setTimeout(function () {
          if (!isenter) {
            linkel.popup('hide');
            linkel.unbind('mouseleave');
          }
        }, 250);
      });
      isbindleave = true;  
    }
  });
  linkel.mouseleave(function () {
    setTimeout(function () {
      if (!isenter) {
        linkel.popup('hide');
        linkel.unbind('mouseleave');
      }
    }, 250);
  });

  $.ajax({
    type: "GET",
    url: '/user/card/' + page_id,
    success: function (data) {
      if (!data || data.err) {
        //alert(data.err);
        return;
      }
      var card = data.card;
      var html = '\
<div class="ui user-card" id="' + cardelid + '">\
  <div class="user-cover">\
    <div class="user-front-cover">\
      <img src="' + card.cover +'">\
    </div>\
    <div class="user-info">\
      <div class="user-info-bar">\
        <div class="user-info-block">\
          <div class="user-avatar img-circle">\
            <img src="' + card.avatar + '">\
          </div>\
          <div class="user-text">\
            <div class="user-text-block">\
              <div class="user-name">\
                <a href="/user/' + card.id + '" target="blank_">' + card.name + '</a>\
              </div>\
            </div>\
          </div>\
        </div>\
      </div>\
    </div>\
    <div class="user-bottom">\
    </div>\
  </div>\
  <div class="user-bio">\
    <span>\
      ' + htmlspecialchars(card.bio) + '\
    </span>\
  </div>\
  <div class="inner">\
    <div class="clearfix"></div>\
  </div>\
</div>';
      popel.html(html);
    },
    dataType: 'json',
  });
  //}, 200);
}

function initUserPageCard() {
  $('.user-name a, .wmd-preview a').hover(function () {
    var userUrl = $(this).attr('href');
    var m = userUrl.match(/\/(user|topic\/page)\/([a-z0-9]+)/);
    if (m) {
      var pageId = m[2];
      var cardId = 'card-' + pageId;

      var timer = $(this).data('timer');
      if (timer) {
        clearTimeout(timer);
        $(this).data('timer', 0);
        return;
      }

      var that = this;
      timer = setTimeout(function () {
        //check exists
        var cardel = $('#' + cardId);
        if (cardel.length > 0) {
          //.is(":visible")
          setTimeout(function () {
            cardel.parent().remove();
          }, 250);
          return;
        }

        var opts = {
          debug: false,
          className: {popup: 'ui popup card'},
          on: 'click',
          html: '<div class="ui active loader" id="' + cardId + '"></div>',
        };

        $(that).popup(opts).popup('toggle');
        show_page_card(that, cardId, pageId);
      }, 600);
      $(this).data('timer', timer);
    }
  }, function () {
    var timer = $(this).data('timer') || 0;
    if (timer) {
      clearTimeout(timer);
      $(this).data('timer', 0);
    }
  });
}
