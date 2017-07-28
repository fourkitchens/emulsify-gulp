/* globals require, process */
const _ = require('lodash');
const notifier = require('./notifier.js');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

((() => {
  module.exports = (gulp, config, { watch, compile }, browserSync) => {
    const plConfig = yaml.safeLoad(
      // eslint-disable-next-line comma-dangle
      fs.readFileSync(config.patternLab.configFile, 'utf8')
    );
    const plRoot = path.join(config.patternLab.configFile, '../..');
    const plSource = path.join(plRoot, plConfig.sourceDir);
    const consolePath = path.join(plRoot, 'core/console');

    function plBuild(cb) {
      notifier.sh(`php ${consolePath} --generate`, true, () => {
        if (config.browserSync.enabled) {
          browserSync.reload('*.html');
        }
        cb();
      });
    }

    gulp.task('pl', 'Compile Pattern Lab', plBuild);

    const watchedExtensions = config.patternLab.watchedExtensions.join(',');
    gulp.task('watch:pl', () => {
      const plGlob = path.normalize(`${plSource}/**/*.{${watchedExtensions}}`);
      gulp.watch(plGlob, (event) => {
        // eslint-disable-next-line no-console
        console.log(`File ${path.relative(process.cwd(), event.path)} was ${event.type}, running tasks...`);
        notifier.sh(`php ${consolePath} --generate`, false, () => {
          if (config.browserSync.enabled) {
            browserSync.reload('*.html');
          }
        });
      });
    });

    const plFullDependencies = [];

    if (config.patternLab.scssToJson) {
      // turns scss files full of variables into json files that PL can iterate on
      gulp.task('pl:scss-to-json', (done) => {
        config.patternLab.scssToJson.forEach(({ src, lineStartsWith, allowVarValues, dest }) => {
          const scssVarList = _.filter(fs.readFileSync(src, 'utf8').split('\n'), item => _.startsWith(item, lineStartsWith));
          // console.log(scssVarList, item.src);
          let varsAndValues = _.map(scssVarList, (item) => {
            const x = item.split(':');
            return {
              name: x[0].trim(), // i.e. $color-gray
              value: x[1].replace(/;.*/, '').trim(), // i.e. hsl(0, 0%, 50%)
            };
          });

          if (!allowVarValues) {
            varsAndValues = _.filter(varsAndValues, ({ value }) => !_.startsWith(value, '$'));
          }

          fs.writeFileSync(dest, JSON.stringify({
            items: varsAndValues,
            meta: {
              description: `To add to these items, use Sass variables that start with <code>${lineStartsWith}</code> in <code>${src}</code>`,
            },
          }, null, '  '));
        });
        done();
      });
      plFullDependencies.push('pl:scss-to-json');

      gulp.task('watch:pl:scss-to-json', () => {
        const files = config.patternLab.scssToJson.map(({ src }) => src);
        gulp.watch(files, ['pl:scss-to-json']);
      });
      watch.push('watch:pl:scss-to-json');
    }

    gulp.task('pl:full', false, plFullDependencies, plBuild);

    watch.push('watch:pl');
    compile.push('pl:full');
  };
}))();
