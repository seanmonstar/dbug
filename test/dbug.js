/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

process.env.DEBUG = 'foo';
process.env.DEBUG_COLORS = false;

const assert = require('insist');

const utc = require('utcstring');

const dbug = require('../');
const ORIG_COLORED = dbug.colored;

const foo = require('../')('foo');
const bar = require('../')('bar');

const stdout = {
  lastWrite: '',
  write: function(out) {
    this.lastWrite = out;
  }
};

const stderr = {
  lastWrite: '',
  write: function(out) {
    this.lastWrite = out;
  }
};

// XXX: v0.8 support. remove when dropped
var out = process.stdout.write;
var err = process.stderr.write;
function testOut(v) {
  stdout.lastWrite = v;
  return true;
}
function testErr(v) {
  stderr.lastWrite = v;
  return true;
}

function contains(haystack, needle) {
  return haystack.indexOf(needle) !== -1;
}

module.exports = {
  'dbug': {
    'before': function() {
      //console._stdout = stdout;
      //console._stderr = stderr;
    },
    'matching': {
      'exact should be enabled': function() {
        assert(foo.enabled);
      },
      'group should enable children': function() {
        var foobaz = require('../')('foo:baz');
        assert(foobaz.enabled);
      },
      'substring should not be enabled': function() {
        var food = require('../')('food');
        assert(!food.enabled);
      },
      'should check dbug.env every time': function() {
        dbug.env = 'derp';
        var derp = require('../')('derp');
        assert(derp.enabled);
        dbug.env = 'foo';
        assert(!derp.enabled);
      }
    },
    'enabled': {
      'should return a function': function() {
        assert.equal(typeof foo, 'function');
      },
      'should return log, debug, info, warn, error functions': function() {
        assert.equal(typeof foo.log, 'function');
        assert.equal(typeof foo.debug, 'function');
        assert.equal(typeof foo.info, 'function');
        assert.equal(typeof foo.warn, 'function');
        assert.equal(typeof foo.error, 'function');
      },
      'should be enabled': function() {
        assert(foo.enabled);
        foo.colored = true;

        process.stdout.write = testOut;
        process.stderr.write = testErr;

        foo('z');
        assert(contains(stdout.lastWrite, 'z'));
        foo.debug('y');
        assert(contains(stdout.lastWrite, 'y'));
        foo.log('x');
        assert(contains(stdout.lastWrite, 'x'));
        foo.info('w');
        assert(contains(stdout.lastWrite, 'w'));
        assert(contains(stdout.lastWrite, 'foo:'));
        assert(contains(stdout.lastWrite, '\x1b[92mINFO'));
        foo.warn('v');
        assert(contains(stderr.lastWrite, 'v'));
        foo.error('uuuu');
        assert(contains(stderr.lastWrite, 'uuuu'));
        assert(contains(stderr.lastWrite, 'foo:'));
        assert(contains(stderr.lastWrite, '\x1b[91mERROR'));

        dbug.colored = false;
        process.stdout.write = out;
        process.stderr.write = err;
      }
    },
    'disabled': {
      'should return a function': function() {
        assert.equal(typeof bar, 'function');
      },
      'should return log, debug, info, warn, error functions': function() {
        assert.equal(typeof bar.log, 'function');
        assert.equal(typeof bar.debug, 'function');
        assert.equal(typeof bar.info, 'function');
        assert.equal(typeof bar.warn, 'function');
        assert.equal(typeof bar.error, 'function');
      },
      'should be disabled': function() {
        process.stdout.write = testOut;
        process.stderr.write = testErr;

        assert(!bar.enabled);
        bar('a');
        assert.notEqual(stdout.lastWrite, 'a');
        bar.warn('b');
        assert.notEqual(stdout.lastWrite, 'b');

        process.stdout.write = out;
        process.stderr.write = err;
      }
    },

    'color': {
      'should look for DEBUG_COLORS to override tty': function() {
        assert(!ORIG_COLORED);
      },
      'should format with utc if plain': function() {
        var plain = dbug('foo');
        assert(!plain.colored);

        process.stdout.write = testOut;

        plain('bar baz quux');
        assert(utc.has(stdout.lastWrite));
        assert(contains(stdout.lastWrite, 'bar baz quux'));

        plain('fuji', 'barbie');
        assert(contains(stdout.lastWrite, 'fuji barbie'));


        process.stdout.write = out;
      },
      'should check dbug.colored every time': function() {
        dbug.colored = true;
        var check = require('../')('check');
        assert(check.colored);
        dbug.colored = false;
        assert(!check.colored);
      }
    },

    '__log': {
      // woah. this is a private API. don't rely on it. i can blow it up
      // any time. kablamo!
      'should provide new log method': function() {
        var d = require('../');
        var counter = 0;
        var arg;
        d.__log = function(name, level, args) {
          counter++;
          assert.equal(name, 'foo');
          assert.equal(level, 'debug');
          assert.equal(args[0], arg);
        };

        var dbug = d('foo');
        assert.equal(counter, 0);
        dbug(arg = 'bar');
        assert.equal(counter, 1);
        dbug(arg = 'baz');
        assert.equal(counter, 2);
      }
    },

    'after': function() {
      //console._stdout = process.stdout;
      //console._stderr = process.stderr;
    }
  }
};
