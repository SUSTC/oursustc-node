
/**
 * Module dependencies.
 */

var express = require('express'),
  bodyParser = require('body-parser'),
  multipart = require('connect-multiparty'),
  cookieParser = require('cookie-parser'),
  //session      = require('express-session'),
  serveStatic = require('serve-static'),
  methodOverride = require('method-override'),
  morgan  = require('morgan'), //logger
  errorHandler = require('errorhandler');
  //viewCache = require('express-view-cache');
  //MongoStore = require('connect-mongo')(session);
  //MongoStore = require('connect-mongo')(express);

var http = require('http'),
  path = require('path');


var constdata = require('./src/common/constdata'),
  config = require('./src/config/config.json'),
  router = require('./src/base/router'),
  core = require('./src/base/core');

var app = express();

//3.x app.configure
(function() {
  app.set('port', process.env.PORT || 3005);

  //app.use(viewCache(5000, {'type':'application/json', 'driver':'memory'}));

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.use(express.favicon());
  app.use(bodyParser({
    uploadDir: constdata.TMP_DIR
  }));
  //4.x multipart
  app.use(multipart({
    uploadDir: constdata.TMP_DIR
  }));
  app.use(cookieParser());
  /*app.use(session({
    secret: config.SESSION_KEY,
    store: new MongoStore({
      db: config.DB_NAME,
      collection: config.DB_PREFIX + 'sessions',
      host: config.DB_HOST,
      port: config.DB_PORT,
      username: config.DB_USER,
      password: config.DB_PASS,
    })
  }));*/
  app.use(methodOverride());

  app.use(core.coreMiddleware);

  //nginx process
  app.use(serveStatic(constdata.PUBLIC_DIR));
})();

var node_env = process.env.NODE_ENV;
console.log("NODE_ENV: " + node_env);
if (!node_env) {
  node_env = 'development';
}
// default configure is development
// 4.x
switch (node_env) {
  case 'development':
    app.use(morgan({ format: 'dev' }));
    app.use(errorHandler());
    break;
  case 'production':
    app.use(errorHandler());
    app.set('view cache', true);
    break;
}
//3.x
/*app.configure('development', function () {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
});
app.configure('production', function () {
  app.use(express.errorHandler());
  app.set('view cache', true);
});*/

router.route(app, express);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});
