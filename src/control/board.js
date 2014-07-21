(function() {

  var EventProxy = require('eventproxy');

  var view = require("./../common/view"),
    functions = require("./../common/functions"),
    string = require("./../common/string"),
    proxy = require("./../proxy"),
    BoardProxy = proxy.Board,
    TopicProxy = proxy.Topic;

  var Topic = require("./../class/topic").Topic;

  /* BoardProxy.newAndSave('bla', 'baba', 0, 0, '', '53c908582ccde07c15000022', function (err, b) {
    console.log(err, b);
  }); */

  /*function initData(res, data, subtitle) {
    if (subtitle) {
      data.title = subtitle + ' - ' + res.locals.core.lang.title.bbs.index;
    } else {
      data.title = res.locals.core.lang.title.bbs.index;
    }
  }*/

  exports.index = function(req, res, data, callback) {

    //initData(res, data);

    if (req.params.shortcut) {
      data.active = 'board/' + req.params.shortcut;

      var topic = new Topic(req.params.shortcut);
      topic.index(req, res, data, callback);
    } else {
      // All preprocessing completed, Render the page
      var e = EventProxy.create(['render'], function(status) {
        data.active = 'board';
        callback();

      });
      // Tree has been built, Do preprocessing here PLS
      e.once('treebuilt', function(tree) {
        var record = tree; //This is for debugging only
        /*
        var dumptree = function(tree, level) {
          if (tree)
            for (var i in tree) {
              console.log(level, tree[i]._id);
              dumptree(tree[i].children, level + 1);
            }
        }
        dumptree(tree, 1); // For debugging
        */
        e.emit('render', record)
      });
      //Here we build the tree structure BEGIN
      BoardProxy.fetchAll(function(err, list) {
        var tree = [];
        // build function BEGIN
        var build = function(parent) {
          var current = parent;
          current.children = [];

          for (var i = 0; i < list.length; i++) {
            if ((typeof(list[i].parent) !== 'undefined') && (list[i].parent == parent._id.toString())) {
              var child = build(list[i]);
              current.children[child._id] = child;
            }
          }
          return current;
        };
        // build function END

        for (var i = 0; i < list.length; i++) {
          if (list[i].parent == null) {
            var child = build(list[i]);
            tree[child._id] = child;
          }
        }
        e.emit('treebuilt', tree);

      });
      // Tree building END
    }

  };

  exports.add = function(req, res, data, callback) {
    //initData(res, data, res.locals.core.lang.topic.add);
    if (req.params.shortcut) {
      data.active = 'board/' + req.params.shortcut;

      var topic = new Topic(req.params.shortcut);
      topic.add(req, res, data, callback);
    } else {
      res.redirect('/board');
      callback(true);
    }
  };

}).call(this);
