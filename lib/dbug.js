/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const tty = require('tty');

const names = [];
const skips = [];
const colors = [6, 2, 3, 4, 5, 1];
var prevColor = 0;
var useColor = tty.isatty(2) || process.env.DEBUG_COLOR;

(process.env.DEBUG || '')
  .split(/[\s,]+/)
  .forEach(function(name){
    name = name.replace('*', '.*?');
    if (name[0] === '-') {
      skips.push(new RegExp('^' + name.substr(1) + '$'));
    } else {
      names.push(new RegExp('^' + name + '(:.+)?$'));
    }
  });



function color() {
  return colors[prevColor++ % colors.length];
}

function coerce(val) {
  if (val instanceof Error) {
    return val.stack || val.message;
  }
  return val;
}

function disable() {
  function disabled() {}
  disabled.enabled = false;
  disabled.log =
  disabled.debug =
  disabled.info =
  disabled.warn =
  disabled.error =
    function noop() {};
  return disabled;
}

function enable(name) {
  var c;
  var format = useColor ? function colored(level, text) {
    text = coerce(text);
    if (!c) {
      c = color();
    }
    return '  \u001b[9' + c + 'm' + name + '.' + level + ' '
      + '\u001b[3' + c + 'm\u001b[90m'
      + text;
  } : function plain(text) {
    text = coerce(text);

    return new Date().toUTCString()
      + ' ' + name + ' ' + text;
  };

  function logAt(level) {
    return function log(text) {
      text = format(level === 'log' ? 'debug' : level, text);
      console[level].apply(console, arguments);
    };
  }
  
  function dbug() {
    dbug.log.apply(this, arguments);
  }
  dbug.enabled = true;
  dbug.log = logAt('log');
  dbug.debug = dbug.log;

  dbug.info = logAt('info');
  dbug.warn = logAt('warn');
  dbug.error = logAt('error');
  return dbug;
}

module.exports = function dbug(name) {
  var match = skips.some(function(re){
    return re.test(name);
  });

  if (match) {
    return disable();
  }

  match = names.some(function(re){
    return re.test(name);
  });

  if (!match) {
    return disable();
  }


  return enable(name);
};
