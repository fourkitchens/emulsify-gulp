/* globals require, process */

(function () {

  'use strict';

  // General
  var _ = require('lodash');
  var notifier = require('./notifier.js');
  var browserSync = require('browser-sync').create();

  // Pattern Lab
  var path = require('path');
  var yaml = require('js-yaml');
  var fs = require('fs');

  module.exports = function (gulp, config, tasks) {

    var plConfig = yaml.safeLoad(
      fs.readFileSync(config.patternLab.configFile, 'utf8')
    );
    var plRoot = path.join(config.patternLab.configFile, '../..');
    var plSource = path.join(plRoot, plConfig.sourceDir);
    var plPublic = path.join(plRoot, plConfig.publicDir);
    var plMeta = path.join(plSource, '/_meta');
    var consolePath = path.join(plRoot, 'core/console');

    function plBuild(cb) {
      notifier.sh('php ' + consolePath + ' ' + '--generate', true, function () {
        if (config.browserSync.enabled) {
          browserSync.reload;
        }
        cb();
      });
    }

    gulp.task('pl', 'Compile Pattern Lab', plBuild);

    var watchedExtensions = config.patternLab.watchedExtensions.join(',');
    gulp.task('watch:pl', function () {
      var plGlob = path.normalize(plSource + '/**/*.{' + watchedExtensions + '}');
      gulp.watch(plGlob, function (event) {
        console.log('File ' + path.relative(process.cwd(), event.path) + ' was ' + event.type + ', running tasks...');
        notifier.sh('php ' + consolePath + ' ' + '--generate', false, function () {
          if (config.browserSync.enabled) {
            browserSync.reload;
          }
        });
      });
    });

    var plFullDependencies = [];

    if (config.patternLab.scssToJson) {
      // turns scss files full of variables into json files that PL can iterate on
      gulp.task('pl:scss-to-json', function (done) {
        config.patternLab.scssToJson.forEach(function (pair) {
          var scssVarList = _.filter(fs.readFileSync(pair.src, 'utf8').split('\n'), function (item) {
            return _.startsWith(item, pair.lineStartsWith);
          });
          // console.log(scssVarList, item.src);
          var varsAndValues = _.map(scssVarList, function (item) {
            var x = item.split(':');
            return {
              name: x[0].trim(), // i.e. $color-gray
              value: x[1].replace(/;.*/, '').trim() // i.e. hsl(0, 0%, 50%)
            };
          });

          if (!pair.allowVarValues) {
            varsAndValues = _.filter(varsAndValues, function (item) {
              return !_.startsWith(item.value, '$');
            });
          }

          fs.writeFileSync(pair.dest, JSON.stringify({
            items: varsAndValues,
            meta: {
              description: 'To add to these items, use Sass variables that start with <code>' + pair.lineStartsWith + '</code> in <code>' + pair.src + '</code>'
            }
          }, null, '  '));

        });
        done();
      });
      plFullDependencies.push('pl:scss-to-json');

      gulp.task('watch:pl:scss-to-json', function () {
        var files = config.patternLab.scssToJson.map(function (file) {return file.src;});
        gulp.watch(files, ['pl:scss-to-json']);
      });
      tasks.watch.push('watch:pl:scss-to-json');
    }

    gulp.task('pl:full', false, plFullDependencies, plBuild);


    tasks.watch.push('watch:pl');
    tasks.compile.push('pl:full');

  };

})();
