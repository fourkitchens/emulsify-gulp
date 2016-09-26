/* globals require, process */

(function () {
  'use strict';
  var exec = require('child_process').exec;

  function sh(cmd, exitOnError, cb) {
    var child = exec(cmd, {encoding: 'utf8'});
    var stdout = '';
    var stderr = '';
    child.stdout.on('data', function (data) {
      stdout += data;
      process.stdout.write(data);
    });
    child.stderr.on('data', function (data) {
      stderr += data;
      process.stdout.write(data);
    });
    child.on('close', function (code) {
      if (code > 0) {
        console.log('Error with code ' + code + ' after running: ' + cmd);
        process.exit(code);
      }
      cb();
    });
  }

  module.exports = {
    sh: sh
  };

})();
