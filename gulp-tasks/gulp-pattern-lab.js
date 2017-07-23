/* globals require, process */

((() => {

  'use strict';

  // General
  const _ = require('lodash');
  const notifier = require('./notifier.js');
  const browserSync = require('browser-sync').create();

  // Pattern Lab
  const path = require('path');
  const yaml = require('js-yaml');
  const fs = require('fs');

  module.exports = (gulp, config, tasks) => {

    const plConfig = yaml.safeLoad(
      fs.readFileSync(config.patternLab.configFile, 'utf8')
    );
    const plRoot = path.join(config.patternLab.configFile, '../..');
    const plSource = path.join(plRoot, plConfig.sourceDir);
    const plPublic = path.join(plRoot, plConfig.publicDir);
    const plMeta = path.join(plSource, '/_meta');
    const consolePath = path.join(plRoot, 'core/console');

    function plBuild(cb) {
      notifier.sh('php ' + consolePath + ' ' + '--generate', true, () => {
        if (config.browserSync.enabled) {
          browserSync.reload;
        }
        cb();
      });
    }

    gulp.task('pl', 'Compile Pattern Lab', plBuild);

    const watchedExtensions = config.patternLab.watchedExtensions.join(',');
    gulp.task('watch:pl', () => {
      const plGlob = path.normalize(plSource + '/**/*.{' + watchedExtensions + '}');
      gulp.watch(plGlob, event => {
        console.log('File ' + path.relative(process.cwd(), event.path) + ' was ' + event.type + ', running tasks...');
        notifier.sh('php ' + consolePath + ' ' + '--generate', false, () => {
          if (config.browserSync.enabled) {
            browserSync.reload;
          }
        });
      });
    });

    const plFullDependencies = [];

    if (config.patternLab.scssToJson) {
      // turns scss files full of variables into json files that PL can iterate on
      gulp.task('pl:scss-to-json', done => {
        config.patternLab.scssToJson.forEach(pair => {
          let scssVarList = _.filter(fs.readFileSync(pair.src, 'utf8').split('\n'), item => _.startsWith(item, pair.lineStartsWith));
          // console.log(scssVarList, item.src);
          let varsAndValues = _.map(scssVarList, item => {
            let x = item.split(':');
            return {
              name: x[0].trim(), // i.e. $color-gray
              value: x[1].replace(/;.*/, '').trim() // i.e. hsl(0, 0%, 50%)
            };
          });

          if (!pair.allowVarValues) {
            varsAndValues = _.filter(varsAndValues, item => !_.startsWith(item.value, '$'));
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

      gulp.task('watch:pl:scss-to-json', () => {
        const files = config.patternLab.scssToJson.map(file => file.src);
        gulp.watch(files, ['pl:scss-to-json']);
      });
      tasks.watch.push('watch:pl:scss-to-json');
    }

    gulp.task('pl:full', false, plFullDependencies, plBuild);

    tasks.watch.push('watch:pl');
    tasks.compile.push('pl:full');

  };

}))();
