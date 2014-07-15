
(function() {

    var string = require('./string');

    var PAGINATION_SHOW_COUNT = 20;

    exports.PAGINATION_LIMIT = PAGINATION_SHOW_COUNT;

    exports.pagination = function(current_page, count, url) {
        var page = {
            'current': current_page, 
            'start': 1,
            'count': count,
            'url': url,
            'havequery': (url.indexOf('?') !== -1)
        };
        if (page.havequery) {
            page.url += '&';
        } else {
            page.url += '?';
        }
        if (current_page > count && count > 0) {
            current_page = 1;
        }
        if (current_page > PAGINATION_SHOW_COUNT / 2) {
            page.start = current_page - Math.floor(PAGINATION_SHOW_COUNT / 2);
        } else if (current_page === 0) {
            page.start = 1;
        }
        if (current_page === 1) {
            page.disable_begin = true;
        }
        if (current_page === count || count <= 0) {
            page.disable_last = true;
        }

        page.end = page.start + PAGINATION_SHOW_COUNT - 1;
        if (page.end >= count) {
            page.end = count;
        }

        if (page.start > 1) {
            page.show_ellipsis_begin = true;
        }
        if (count - page.end > 0) {
            page.show_ellipsis_last = true;
        }

        return page;
    };

    exports.get_page = function(query_page) {
        var page = 1;
        if (query_page !== undefined) {
          if (string.is_numeric(query_page)) {
            page = parseInt(query_page);
          } else {
            page = 0;
          }
        }
        return page;
    };

    exports.order = function(req, map) {
        var order_;
        var orderUrl = '';

        if (req.query.sort && req.query.order && map.src) {
          var torder = {};
          var index = map.src.indexOf(req.query.sort);
          if (index !== -1) {
            var name = (map.dst && map.dst[index]) ? map.dst[index] : map.src[index];
            if (map.convert && map.convert[map.src[index]]) {
                torder.name = { column: name, charset: 'gbk' };
            } else {
                torder.name = name
            }
          }
          switch (req.query.order) {
          case 'asc':
            torder.sort = 'ASC';
            break;
          case 'desc':
            torder.sort = 'DESC';
            break;
          }
          if (torder.name && torder.sort) {
            order_ = torder;
            orderUrl = '?sort=' + req.query.sort + '&order=' + req.query.order;
          }
        }

        return {
            order: order_,
            orderUrl: orderUrl
        };
    };

    exports.showMessage = function(data, info, type, redirect, controlCallback) {
        if (redirect instanceof Function) {
            controlCallback = redirect;
            redirect = null;
        }
        data.message = {
            info: info,
            type: type,
            redirect: redirect
        };
        controlCallback(false, data, 'common/message');
    };

}).call(this);
