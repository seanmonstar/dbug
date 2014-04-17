/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const tty = require('tty').isatty(2);

const colors = {
  debug: 6,
  info: 2,
  warn: 3,
  error: 1
};

function envDebugColor(colorString) {
  try {
    return !!JSON.parse(colorString);
  } catch (ex) {
    return false;
  }
}

function parseDEBUG(debugStr) {
  var names = [];
  var skips = [];
  debugStr
    .split(/[\s,]+/)
    .forEach(function(name){
      name = name.replace('*', '.*?');
      if (name[0] === '-') {
        skips.push(new RegExp('^' + name.substr(1) + '$'));
      } else {
        names.push(new RegExp('^' + name + '(:.+)?$'));
      }
    });

  return {
    names: names,
    skips: skips
  };
}

function getter(obj, name, fn) {
  Object.defineProperty(obj, name, {
    get: fn
  });
}

function coerce(val) {
  if (val instanceof Error) {
    return val.stack || val.message;
  }
  return val;
}

function isEnabled(debugStr, name) {
  var env = parseDEBUG(debugStr);
  var match = env.skips.some(function(re){
    return re.test(name);
  });
  if (match) {
    return false;
  }

  match = env.names.some(function(re){
    return re.test(name);
  });

  if (!match) {
    return false;
  }
  return true;
}

function isColored() {
  var env = process.env.DEBUG_COLORS;
  return env ? envDebugColor(env) : tty;
}

function logger(name) {
  name = name + ':';
  function colored(level, text) {
    text = coerce(text);
    var c = colors[level];
    return [
      '  ',
      name,
      '\x1b[9' + c + 'm' + level.toUpperCase() + '\x1b[39m ',
      '\x1b[90m' + text + '\x1b[39m'
    ].join('');
  }

  function plain(level, text) {
    text = coerce(text);

    return new Date().toUTCString()
      + ' ' + name + level.toUpperCase() + ' ' + text;
  }

  return function log(level, args) {
    var format = isColored() ? colored : plain;
    args[0] = format(level, args[0]);
    console[level === 'debug' ? 'log' : level].apply(console, args);
  };
}

var loggers = {};
function log(name, level, args) {
  loggers[name](level, args);
}


function dbugger(name) {

  function logAt(level) {
    return function canLog() {
      if (!dbug.enabled) {
        return;
      }
      module.exports.__log(name, level, arguments);
    };
  }

  var dbug = logAt('debug');
  dbug.log = logAt('debug');
  dbug.debug = dbug.log;
  dbug.info = logAt('info');
  dbug.warn = logAt('warn');
  dbug.error = logAt('error');

  getter(dbug, 'enabled', function enabled() {
    var DEBUG = process.env.DEBUG;
    if (dbug.__DEBUG === DEBUG) {
      return dbug.__enabled;
    }
    dbug.__DEBUG = DEBUG;
    return dbug.__enabled = isEnabled(DEBUG, name);
  });

  getter(dbug, 'colored', isColored);

  loggers[name] = logger(name);

  return dbug;
}

module.exports = function dbug(name) {
  return dbugger(name);
};

// woah. this is a private API. don't rely on it. i can blow it up
// any time. kablamo!
module.exports.__log = log;
