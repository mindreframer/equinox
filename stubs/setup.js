// test statuses stored here
var test_statuses = [ ];
var current_test;

// assertion failure
function fail (actual, expected, message, operator, error) {
  test_statuses.push({
    actual:       actual,
    expected:     expected,
    message:      message,
    operator:     operator,
    status:       "fail",
    error:        error,
    current_test: current_test,
    filename:     __filename
  });
}

// assertion ok
function ok (actual, expected, message) {
  test_statuses.push({
    actual:       actual,
    expected:     expected,
    status:       "pass",
    message:      message,
    current_test: current_test,
    filename:     __filename
  });
}

// assert methods
var assert = {
  equal: function (actual, expected, message) {
    if (actual !== expected) {
      fail(actual, expected, message, "==");
    } else {
      ok(actual, expected, message);
    }
  },
  deepEqual: function (actual, expected, msg) {
    if (!isDeepEqual(actual, expected)) {
        fail(actual, expected, msg, 'deepEqual');
    } else {
        ok(actual, expected, message);
    }
  }
};

// initial setup
var tests = [ ];

// console methods
console = {
  log: function ( ) {
    var args = Array.prototype.slice.call(arguments);
    plv8.elog(NOTICE, args.join(' '));
  },
  warn: function ( ) {
    var args = Array.prototype.slice.call(arguments);
    plv8.elog(WARNING, args.join(' '));
  },
  error: function ( ) {
    var args = Array.prototype.slice.call(arguments);
    plv8.elog(ERROR, args.join(' '));
  }
};

// check for setup method
if (typeof test_setup === 'function') {
  test_setup();
}


///////////////////////////////////////////////////////////////////////////////////////
// Utilities //////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

// Utility for checking whether a value is undefined or null
function isUndefinedOrNull (val) {
  return (val === null || typeof val === 'undefined');
}

// Utility for checking whether a value is an arguments object
function isArgumentsObject (val) {
    return (Object.prototype.toString.call(val) === '[object Arguments]');
}

// Utility for checking whether an object contains another object
function includes (haystack, needle) {
    /* jshint maxdepth: 3*/
    var i;

    // Array#indexOf, but ie...
    if (isArray(haystack)) {
        for (i = haystack.length - 1; i >= 0; i = i - 1) {
            if (haystack[i] === needle) {
                return true;
            }
        }
    }

    // String#indexOf
    if (typeof haystack === 'string') {
        if (haystack.indexOf(needle) !== -1) {
            return true;
        }
    }

    // Object#hasOwnProperty
    if (typeof haystack === 'object' && haystack !== null) {
        if (haystack.hasOwnProperty(needle)) {
            return true;
        }
    }

    return false;
}

// Utility for checking whether a value is an array
var isArray = Array.isArray || function (val) {
    return (Object.prototype.toString.call(val) === '[object Array]');
};

// Utility for getting object keys
function getObjectKeys (obj) {
    var key;
    var keys = [];
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

// Utility for deep equality testing of objects
function objectsEqual (obj1, obj2) {
    /* jshint eqeqeq: false */

    // Check for undefined or null
    if (isUndefinedOrNull(obj1) || isUndefinedOrNull(obj2)) {
        return false;
    }

    // Object prototypes must be the same
    if (obj1.prototype !== obj2.prototype) {
        return false;
    }

    // Handle argument objects
    if (isArgumentsObject(obj1)) {
        if (!isArgumentsObject(obj2)) {
            return false;
        }
        obj1 = Array.prototype.slice.call(obj1);
        obj2 = Array.prototype.slice.call(obj2);
    }

    var obj1Keys;
    var obj2Keys;
    try {
        if (isArray(obj1) && isArray(obj2)) {
            obj1Keys = getObjectKeys(cloneArray(obj1));
            obj2Keys = getObjectKeys(cloneArray(obj2));
        }
        else {
            // Check number of own properties
            obj1Keys = getObjectKeys(obj1);
            obj2Keys = getObjectKeys(obj2);
        }
    } catch (e) {
        return false;
    }

    if (obj1Keys.length !== obj2Keys.length) {
        return false;
    }

    obj1Keys.sort();
    obj2Keys.sort();

    // Cheap initial key test (see https://github.com/joyent/node/blob/master/lib/assert.js)
    var key;
    var i;
    var len = obj1Keys.length;
    for (i = 0; i < len; i += 1) {
        if (obj1Keys[i] != obj2Keys[i]) {
            return false;
        }
    }

    // Expensive deep test
    for (i = 0; i < len; i += 1) {
        key = obj1Keys[i];
        if (!isDeepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    // If it got this far...
    return true;
}

// Utility for deep equality testing
function isDeepEqual (actual, expected) {
    /* jshint eqeqeq: false */
    if (actual === expected) {
        return true;
    }
    if (expected instanceof Date && actual instanceof Date) {
        return actual.getTime() === expected.getTime();
    }
    if (actual instanceof RegExp && expected instanceof RegExp) {
        return (
            actual.source === expected.source &&
            actual.global === expected.global &&
            actual.multiline === expected.multiline &&
            actual.lastIndex === expected.lastIndex &&
            actual.ignoreCase === expected.ignoreCase
        );
    }
    if (typeof actual !== 'object' || typeof expected !== 'object') {
        return actual == expected;
    }
    return objectsEqual(actual, expected);
}