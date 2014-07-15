(function() {

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;
  var config = require('./../config/config.json');

  /* var Fiber = require('fibers'),
    Future = require('fibers/future'),
    wait = Future.wait; */

  var tablepre = config.DB_PREFIX;
  /*
    enum mysql_option 
    {
      MYSQL_OPT_CONNECT_TIMEOUT, MYSQL_OPT_COMPRESS, MYSQL_OPT_NAMED_PIPE,
      MYSQL_INIT_COMMAND, MYSQL_READ_DEFAULT_FILE, MYSQL_READ_DEFAULT_GROUP,
      MYSQL_SET_CHARSET_DIR, MYSQL_SET_CHARSET_NAME, MYSQL_OPT_LOCAL_INFILE,
      MYSQL_OPT_PROTOCOL, MYSQL_SHARED_MEMORY_BASE_NAME, MYSQL_OPT_READ_TIMEOUT,
      MYSQL_OPT_WRITE_TIMEOUT, MYSQL_OPT_USE_RESULT,
      MYSQL_OPT_USE_REMOTE_CONNECTION, MYSQL_OPT_USE_EMBEDDED_CONNECTION,
      MYSQL_OPT_GUESS_CONNECTION, MYSQL_SET_CLIENT_IP, MYSQL_SECURE_AUTH,
      MYSQL_REPORT_DATA_TRUNCATION, MYSQL_OPT_RECONNECT,
      MYSQL_OPT_SSL_VERIFY_SERVER_CERT, MYSQL_PLUGIN_DIR, MYSQL_DEFAULT_AUTH,
      MYSQL_OPT_BIND,
      MYSQL_OPT_SSL_KEY, MYSQL_OPT_SSL_CERT, 
      MYSQL_OPT_SSL_CA, MYSQL_OPT_SSL_CAPATH, MYSQL_OPT_SSL_CIPHER,
      MYSQL_OPT_SSL_CRL, MYSQL_OPT_SSL_CRLPATH,
      MYSQL_OPT_CONNECT_ATTR_RESET, MYSQL_OPT_CONNECT_ATTR_ADD,
      MYSQL_OPT_CONNECT_ATTR_DELETE,
      MYSQL_SERVER_PUBLIC_KEY,
      MYSQL_ENABLE_CLEARTEXT_PLUGIN,
      MYSQL_OPT_CAN_HANDLE_EXPIRED_PASSWORDS
    };
  */
  var MYSQL_OPT_RECONNECT = 20,
    MYSQL_SET_CHARSET_NAME = 7;

  function Database() {
    this.connect();
  }

  Database.prototype.connect = function() {
    var connectUrl = 'mongodb://' + config.DB_USER + ':' + config.DB_PASS + '@' + config.DB_HOST + ':' + config.DB_PORT + '/' + config.DB_NAME;
    mongoose.connect(connectUrl, function (err) {
      if (err) {
        console.error('connect to %s error: ', config.db, err.message);
        process.exit(1);
      }
    });
  };

  Database.prototype.init = function() {

  };

  Database.prototype.query = function(sql, fetch) {
  };

  Database.prototype.last_insert_id = function() {
    var rows = this.query('SELECT LAST_INSERT_ID();', true);
    if (rows && rows[0]) {
      for (var key in rows[0]) {
        return parseInt(rows[0][key]);
      }
    } else {
      return 0;
    }
  };

  var _db = new Database();

  function sql_string(str) {
    return str.replace(/'/g, "''");
  }

  function sql_quote(value) {
    return "'" + value + "'";
  }

  function sql_quote_field(field) {
    return "`" + field + "`";
  }

  function sql_value(value, iscondition) {
    var str = '';
    if (typeof(value) === 'string') {
      str += value;
    } else if (typeof(value) === 'object') {
      var count = 0;
      for (var item in value) {
        if (count > 0) {
          if (iscondition) {
            str += " AND ";
          } else {
            str += ", ";
          }
        }

        str += sql_quote_field(item);

        if (typeof(value[item]) === 'string') {
          str += "=" + sql_quote(sql_string(value[item]));
        } else if (iscondition && (value[item] instanceof Array)) {
          str += " IN (" 
          var arr = value[item];
          for (var i = 0; i < arr.length; i++) {
            if (typeof(arr[i]) === 'string') {
              str += sql_quote(sql_string(arr[i]));
            } else {
              str += sql_quote(arr[i].toString());
            }
            if (i < arr.length - 1) {
              str += ', ';
            }
          }
          str += ")";
        } else if (!iscondition && (value[item] instanceof Object) && value[item].increase) {
          var increase = parseInt(value[item].increase);
          str += "=" + sql_quote_field(item) + ((increase >= 0) ? '+' : '') + increase;
        } else {
          str += "=" + sql_quote(value[item].toString());
        }
        count++;
      }
    }
    return str;
  }

  function sql_order_name(name) {
    if (name instanceof Object) {
      var charset = name.charset ? name.charset : 'gbk';
      return 'CONVERT(' + sql_quote_field(name.column) + ' USING ' + charset + ')';
    } else {
      return sql_quote_field(name);
    }
  }

  function sql_order(order) {
    if (order instanceof Array) {
      var sqlorder = ' ORDER BY';
      for (var i = 0; i < order.length; i++) {
        sqlorder += ' ' + sql_order_name(order.name) + ' ' + order.sort.toUpperCase();
        if (i < order.length - 1) {
          sqlorder += ',';
        }
      }
    } else if (order instanceof Object) {
      return ' ORDER BY ' + sql_order_name(order.name) + ' ' + order.sort.toUpperCase();
    }
  }

  exports.count = function(table, condition) {
    var sql = "SELECT COUNT(*) FROM " + sql_quote_field(tablepre + table);
    if (condition) {
      sql += ' WHERE ' + sql_value(condition, true);
    }
    sql += ';';
    var rows = _db.query(sql, true);
    if (rows && rows[0]) {
      for (var key in rows[0]) {
        return parseInt(rows[0][key]);
      }
    }
    return 0;
  };

  exports.select = function(table, column, condition, limit, order) {
    var sql = "SELECT " + column + " FROM " + sql_quote_field(tablepre + table);
    if (condition) {
      sql += ' WHERE ' + sql_value(condition, true);
    }
    if (order) {
      sql += sql_order(order);
    }
    if (limit && (limit instanceof Array) && limit.length > 0) {
      sql += ' LIMIT ' + parseInt(limit[0]);
      if (limit.length > 1) {
        sql += ', ' + parseInt(limit[1]);
      }
    }
    sql += ';';
    return _db.query(sql, true);
  };

  exports.update = function(table, value, condition) {
    var sql = "UPDATE " + sql_quote_field(tablepre + table) + " SET "
      + sql_value(value)
      + " WHERE " + sql_value(condition, true) + ";";
    return _db.query(sql, false);
  };

  exports.increase = function(table, name, increase, condition) {
    var sql = "UPDATE " + sql_quote_field(tablepre + table) + " SET "
      + sql_quote_field(item) + "=" + sql_quote_field(item) + ((increase >= 0) ? '+' : '') + increase.toString()
      + " WHERE " + sql_value(condition, true) + ";";
    return _db.query(sql, false);
  };

  exports.insert = function(table, value, getid) {
    var sql = "INSERT INTO " + sql_quote_field(tablepre + table) + " SET "
      + sql_value(value) + ";";
    if (_db.query(sql, false)) {
      if (getid) {
        return _db.last_insert_id();
      } else {
        return true;
      }
    } else {
      if (getid) {
        return 0;
      } else {
        return false;
      }
    }
  };

  exports.delete = function(table, condition) {
    var sql = "DELETE FROM " + sql_quote_field(tablepre + table)
      + " WHERE " + sql_value(condition, true) + ";";
    return _db.query(sql, false);
  };

  exports.last_insert_id = function() {
    return _db.last_insert_id();
  };

  exports.init = function(sql) {
    return _db.init();
  };

  exports.query = function(sql) {
    return _db.query(sql, false);
  };

  exports.fetch = function(sql) {
    return _db.query(sql, true);
  };

  exports.begin = function() {
    return _db.query('BEGIN;', false);
  };

  exports.commit = function() {
    return _db.query('COMMIT;', false);
  };

  exports.rollback = function() {
    return _db.query('ROLLBACK;', false);
  };

}).call(this);
