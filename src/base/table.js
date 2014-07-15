
(function() {

  var sys = require('sys'),
    functions = require("./../common/functions"),
    db = require('./db');

  var table_instance_list = {};

  var Table = function() {
    this._table = '';
    this._pk = '';
  }

  Table.prototype._insert = function(value, getid) {
    return db.insert(this._table, value, getid ? true : false);
  };

  Table.prototype.insert = function(value, getid) {
    return this._insert(value, getid);
  };

  Table.prototype._select = function(column, condition, limit, order) {
    return db.select(this._table, column, condition, limit, order);
  };

  Table.prototype.select = function(column, condition, limit, order) {
    return this._select(column, condition, limit, order);
  };

  Table.prototype._update = function(id, value) {
    var obj;
    if (id instanceof Array) {
      obj = {};
      obj[this._pk] = functions.parse_int(id);
    } else if (id instanceof Object) {
      obj = id;
    } else {
      obj = {};
      obj[this._pk] = parseInt(id);
    }
    return db.update(this._table, value, obj);
  };

  Table.prototype.update = function(id, value) {
    return this._update(id, value);
  };

  Table.prototype._query = function(id) {
    var obj;
    if (id instanceof Array) {
      obj = {};
      obj[this._pk] = functions.parse_int(id);
    } else if (id instanceof Object) {
      obj = id;
    } else {
      obj = {};
      obj[this._pk] = parseInt(id);
    }
    return db.select(this._table, '*', obj);
  };

  Table.prototype.query = function(id) {
    return this._query(id);
  };

  Table.prototype._delete = function(id) {
    var obj;
    if (id instanceof Array) {
      obj = {};
      obj[this._pk] = functions.parse_int(id);
    } else if (id instanceof Object) {
      obj = id;
    } else {
      obj = {};
      obj[this._pk] = parseInt(id);
    }
    return db.delete(this._table, obj);
  };

  Table.prototype.delete = function(id) {
    return this._delete(id);
  };

  Table.prototype._count = function(condition) {
    return db.count(this._table, condition);
  };

  Table.prototype.count = function(condition) {
    return this._count(condition);
  };

  exports.Table = Table;
  exports.t = function(table_name) {
    if (!table_instance_list[table_name]) {
      var _T = require('./../table/' + table_name).T;
      table_instance_list[table_name] = new _T();
    }
    return table_instance_list[table_name];
  };

}).call(this);