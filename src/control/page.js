
(function() {

  exports.thanks = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.page.thanks;
    data.pageinfo = res.locals.core.lang.info.page.thanks.description;
    data.active = 'page-thanks';

    callback();

  };

  exports.privacypolicy = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.page.privacypolicy;
    data.pageinfo = res.locals.core.lang.info.page.privacypolicy.description;
    data.active = 'page-privacypolicy';

    callback();

  };

  exports.about = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.page.about;
    data.pageinfo = res.locals.core.lang.info.page.about.description;
    data.active = 'page-about';

    callback();

  };

  exports.print = function(req, res, data, callback) {

    data.title = res.locals.core.lang.title.page.print;
    data.pageinfo = res.locals.core.lang.info.page.print.description;
    data.active = 'page-print';

    callback();

  };
  
}).call(this);