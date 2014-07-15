// for page sidenav
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

  var $overview = $('#overview');

  // Disable certain links in docs
  $('section [href^=#]').click(function (e) {
    e.preventDefault();
  });

  // side bar
  setTimeout(function () {
    $('.bs-docs-sidenav').affix({
      offset: {
        top: function () { return $overview.outerHeight() - 1; }
      , bottom: 270
      }
    });
  }, 100);

}(window.jQuery);
