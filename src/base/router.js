(function() {
  var express = require('express');
  var router = express.Router();

  var mvc = require("./mvc"),
    string = require("./../common/string"),
    functions = require("./../common/functions"),
    routeMvc;

  exports.routeErrorPage = function(app, express) {
    app.use(function(req, res, next) {
      mvc.warn("error 404: ", req.url);

      var data = { 'title': res.locals.core.lang.title.error404, 'active': '' };
      res.locals.core.renderData(data);

      return res.status(404).render('error/404', data);
    });
    app.use(function(err, req, res, next) {
      mvc.error('error 500: ', err.stack);

      var data = { 'title': res.locals.core.lang.title.error500, 'active': '', 'err': err };
      res.locals.core.renderData(data);

      return res.status(500).render('error/500', data);
    });
  };

  exports.route = function(app, express) {
    router.all('/', function(req, res, next) {
      return routeMvc('index', 'index', req, res, next);
    });

    router.all('/:controller', function(req, res, next) {
      return routeMvc(req.params.controller, 'index', req, res, next);
    });

    //fix for board shortcut url
    router.all('/board/:shortcut', function(req, res, next) {
      return routeMvc('board', 'index', req, res, next);
    });
    router.all('/board/:shortcut/:method', function(req, res, next) {
      return routeMvc('board', req.params.method, req, res, next);
    });

    router.all('/:controller/:method', function(req, res, next) {
      return routeMvc(req.params.controller, req.params.method, req, res, next);
    });
    router.all('/:controller/:method/:id', function(req, res, next) {
      return routeMvc(req.params.controller, req.params.method, req, res, next);
    });

    //for api route
    app.use('/api', function(req, res, next) {
      //req.params.api = true;
      res.locals.core.api = true;
      next();
    }, router);

    //default html page
    app.use('/', router);
  };

  routeMvc = function(controllerName, methodName, req, res, next) {
    var controller, data, method, cmName;
    mvc.log("mvc page, controller: " + controllerName + ", method: " + methodName + ", id: " + req.params.id);
    if (!(controllerName != null)) controllerName = 'index';
    controller = null;
    try {
      controller = require("./../control/" + controllerName);
    } catch (e) {
      mvc.warn("controller not found: " + controllerName, e);
      next();
      return;
    }

    cmName = controllerName + '/' + methodName;
    data = null;

    if (methodName != null) {
      methodName = methodName.replace(/[^a-z0-9A-Z_-]/i, '');
      if (!req.params.id && (string.is_numeric(methodName) || methodName.length === 24)) {
        //req.params.id = parseInt(methodName);
        req.params.id = methodName.replace(/[^a-z0-9]/, '');
        methodName = 'index';
        cmName = controllerName + '/index';
      }

      method = controller[methodName];
      if (!(method instanceof Function)) method = null;
      if (method != null) {
        data = {};
        return method(req, res, data, function(isApi, resdata, template) {
          if (!(data != null)) {
            throw new Error("Controller's return value not implemented!");
          }
          if (template) {
            cmName = template;
          }
          if (isApi) {
            if (resdata) {
              resdata = JSON.stringify(resdata);
            } else {
              data = JSON.stringify(data);
            }
            res.write(resdata ? resdata : data);
            return res.end();
          } else {
            if (res.locals.core.api) {
              data = JSON.stringify(data);
              res.write(data);
              return res.end();
            } else {
              res.locals.core.renderData(data);
              return res.render(cmName, data);
            }
          }
        });
      } else {
        mvc.error('method error: ' + cmName);
        next();
      }
    } else {
      mvc.warn('method not found: ' + cmName);
      next();
    }
  };

}).call(this);
