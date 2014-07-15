
(function() {

    var string = require('./string'),
        os = require('os'),
        fs = require('fs'),
        util = require('util');

    var platform = os.platform();

    function unique_id($extra) {
        $extra = $extra ? $extra : 'c';

        var $val = $extra + Date.now().toString();
        $val = string.md5($val);

        return $val.substr(4, 16);
    }

    function password_hash($password) {

        $itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        $random_state = unique_id();
        $random = '';
        $count = 6;


        for ($i = 0; $i < $count; $i += 16)
        {
            $random_state = string.md5(unique_id() + $random_state);
            $random += string.md5($random_state, true);
        }
        $random = $random.substr(0, $count);
        

        $hash = _hash_crypt_private($password, _hash_gensalt_private($random, $itoa64), $itoa64);

        if ($hash.length == 34)
        {
            return $hash;
        }

        return string.md5($password);
    }

    /**
    * Check for correct password
    *
    * @param string $password The password in plain text
    * @param string $hash The stored password hash
    *
    * @return bool Returns true if the password is correct, false if not.
    */
    function password_check_hash($password, $hash) {

        $itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        if ($hash.length == 34)
        {
            return (_hash_crypt_private($password, $hash, $itoa64) === $hash) ? true : false;
        }

        return (string.md5($password) === $hash) ? true : false;
    }

    /**
    * Generate salt for hash generation
    */
    function _hash_gensalt_private($input, $itoa64, $iteration_count_log2)
    {
        $iteration_count_log2 = $iteration_count_log2 ? $iteration_count_log2 : 6;

        if ($iteration_count_log2 < 4 || $iteration_count_log2 > 31)
        {
            $iteration_count_log2 = 8;
        }

        $output = '$H$';
        $output += $itoa64[Math.min($iteration_count_log2 + 5, 30)];
        $output += _hash_encode64($input, 6, $itoa64);

        return $output;
    }

    /**
    * Encode hash
    */
    function _hash_encode64($input, $count, $itoa64)
    {
        $output = '';
        $i = 0;

        do
        {
            $value = $input.charCodeAt($i++);
            $output += $itoa64[$value & 0x3f];

            if ($i < $count)
            {
                $value |= ($input.charCodeAt($i)) << 8;
            }

            $output += $itoa64[($value >> 6) & 0x3f];

            if ($i++ >= $count)
            {
                break;
            }

            if ($i < $count)
            {
                $value |= ($input.charCodeAt($i)) << 16;
            }

            $output += $itoa64[($value >> 12) & 0x3f];

            if ($i++ >= $count)
            {
                break;
            }

            $output += $itoa64[($value >> 18) & 0x3f];
        }
        while ($i < $count);

        return $output;
    }

    /**
    * The crypt function/replacement
    */
    function _hash_crypt_private($password, $setting, $itoa64)
    {
        $output = '*';

        // Check for correct hash
        if ($setting.substr(0, 3) != '$H$' && $setting.substr(0, 3) != '$P$')
        {
            return $output;
        }

        $count_log2 = $itoa64.indexOf($setting[3]);

        if ($count_log2 < 7 || $count_log2 > 30)
        {
            return $output;
        }

        $count = 1 << $count_log2;
        $salt = $setting.substr(4, 8);

        if ($salt.length != 8)
        {
            return $output;
        }

        /**
        * We're kind of forced to use MD5 here since it's the only
        * cryptographic primitive available in all versions of PHP
        * currently in use.  To implement our own low-level crypto
        * in PHP would result in much worse performance and
        * consequently in lower iteration counts and hashes that are
        * quicker to crack (by non-PHP code).
        */
   
        $hash = string.md5($salt + $password, true);
        do
        {
            $hash = string.md5($hash + $password, true);
        }
        while (--$count);

        $output = $setting.substr(0, 12);
        $output += _hash_encode64($hash, 16, $itoa64);

        return $output;
    }

    function email_check(email) {
        if (email.match(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/) !== null) {
            return true;
        }
        return false;
    }

    function clone(obj) {
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            var copy = [];
            var len = obj.length;
            for (var i = 0; i < len; ++i) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        //throw new Error("Unable to copy obj! Its type isn't supported.");
        return obj;
    }

    /*
    * not for null
    */
    function is_object_empty(obj) {
        for (var name in obj) {
            return false;
        }
        return true;
    }

    function parse_int(value) {
        if (typeof(value) === 'object') {
            for (var key in value) {
                value[key] = parseInt(value[key]);
            }
            return value;
        } else {
            return parseInt(value);
        }
    }

    function findshift(srcObjArray, finds, key, shiftkey, notfound) {
        var objShift = {};
        for (var i = 0; i < finds.length; i++) {
          var found = false;
          for (var j = 0; j < srcObjArray.length; j++) {
            if (srcObjArray[j][key] === finds[i]) {
              found = true;
              objShift[finds[i]] = srcObjArray[j][shiftkey];
              break;
            }
          }
          if (!found && notfound) {
            notfound.push(finds[i]);
          }
        }
        return objShift;
    }

    function cp(srcpath, dstpath, callback) {
        var is = fs.createReadStream(srcpath)
        var os = fs.createWriteStream(dstpath);
        is.pipe(os, callback ? callback : function() {});
    }

    function mv_win(srcpath, dstpath) {
        cp(srcpath, dstpath, function() {
            fs.unlinkSync(srcpath);
        });
    }

    function mv(srcpath, dstpath) {
        //fs module functions all require callbacks now
        fs.rename(srcpath, dstpath, function (err) {
            if (err) console.log(err)
        });
    }

    exports.unique_id = unique_id;
    exports.password_hash = password_hash;
    exports.password_check_hash = password_check_hash;

    exports.email_check = email_check;

    exports.is_object_empty = is_object_empty;
    exports.parse_int = parse_int;
    exports.findshift = findshift;

    exports.clone = clone;

    exports.mkdir = function(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }

    // now change the uplaod tmp dir 
    /* if (platform.substring(0, 3) === 'win') {
        exports.mv = mv_win;
    } else*/ {
        exports.mv = mv;
    }
    exports.cp = cp;
    
    exports.qrurl = function(url, size, l) {
        if (!l) l = 0;
        return 'https://chart.googleapis.com/chart?cht=qr&chs=' + size + 'x' + size + '&choe=UTF-8&chld=L|' + l + '&chl=' + url;
    };

}).call(this);
