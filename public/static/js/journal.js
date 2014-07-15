// for journal
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

  $('.journal-info .bar')
    .mouseenter(function() {
      $(this).stop();

      var bottom = $(this).css('bottom');
      $(this).animate({bottom: '-=' + bottom });
    })
    .mouseleave(function() {
      $(this).stop();

      var bottom = $(this).css('bottom');
      var mbottom = bottom.match(/([0-9\.]+)/);
      var valbottom = 0;
      if (mbottom && mbottom[1]) {
        valbottom = parseFloat(mbottom[1]);
      }

      $(this).animate({bottom: '-=' + (32 - valbottom).toString() + 'px' });
    });


}(window.jQuery);
