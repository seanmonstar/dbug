/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

process.env.DEBUG = 'foo';

const assert = require('assert');

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
      'should check process.env every time': function() {
        process.env.DEBUG = 'derp';
        assert(require('../')('derp').enabled);
        process.env.DEBUG = 'foo';
        assert(!require('../')('derp:herp').enabled);
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

        process.stdout.write = testOut;
        process.stderr.write = testErr;

        function contains(haystack, needle) {
          return haystack.indexOf(needle) !== -1;
        }

        foo('z');
        assert(contains(stdout.lastWrite, 'z'));
        foo.debug('y');
        assert(contains(stdout.lastWrite, 'y'));
        foo.log('x');
        assert(contains(stdout.lastWrite, 'x'));
        foo.info('w');
        assert(contains(stdout.lastWrite, 'w'));
        assert(contains(stdout.lastWrite, 'foo.info'));
        foo.warn('v');
        assert(contains(stderr.lastWrite, 'v'));
        foo.error('uuuu');
        assert(contains(stderr.lastWrite, 'uuuu'));
        assert(contains(stderr.lastWrite, 'foo.error'));

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
      'should default to colored on tty': function() {
        assert.equal(foo.colored, require('tty').isatty(2));
      },
      'should look for DEBUG_COLOR to override tty': function() {
        process.env.DEBUG_COLOR = false;
        assert(require('../')('foo').plain);
      }
    },

    'after': function() {
      //console._stdout = process.stdout;
      //console._stderr = process.stderr;
    }
  }
};
