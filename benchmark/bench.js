/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

process.env.DEBUG = 'bench:enabled';
const dbug = require('../');
const b = dbug('bench:enabled');
const d = dbug('bench:disabled');

var write = process.stdout.write;
process.stdout.write = function(text) {
  if (text.toString('utf8').indexOf('bench:') === -1) {
    return write.apply(this, arguments);
  }
};

var sym = require('crypto').randomBytes(32).toString('hex');
function Foo() {}
Object.defineProperty(Foo.prototype, sym, {
  enumerable: false,
  writable: true,
  value: undefined
});
Object.defineProperty(Foo.prototype, 'foo', {
  get: function() {
    return this[sym];
  },
  set: function(val) {
    this[sym] = val;
  }
});

module.exports = {
  'enabled': {
    'bench': {
      '()': function() {
        b('bench', 'mark');
      },
      'info()': function() {
        b.info('bench', 'mark');
      }
    }
  },
  'disabled': {
    'bench': {
      '()': function() {
        d('bench', 'mark');
      },
      'info()': function() {
        d.info('bench', 'mark');
      }
    }
  }
};
