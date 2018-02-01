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
    const plRoot = path.join(config.paths.pattern_lab, '../');
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

    if (config.patternLab.scssToYAML) {
      // turns scss files full of variables into yaml files that PL can iterate on
      gulp.task('pl:scss-to-yaml', (done) => {
        config.patternLab.scssToYAML.forEach(({ src, lineStartsWith, allowVarValues, dest }) => {
          const scssVarList = _.filter(fs.readFileSync(src, 'utf8').split('\n'), item => _.startsWith(item, lineStartsWith));

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

          fs.writeFileSync(dest, yaml.dump({
            items: varsAndValues,
            meta: {
              description: `To add to these items, use Sass variables that start with <code>${lineStartsWith}</code> in <code>${src}</code>`,
            },
          }));
        });
        done();
      });
      plFullDependencies.push('pl:scss-to-yaml');

      gulp.task('watch:pl:scss-to-yaml', () => {
        const files = config.patternLab.scssToYAML.map(({ src }) => src);
        gulp.watch(files, ['pl:scss-to-yaml']);
      });
      watch.push('watch:pl:scss-to-yaml');
    }

    gulp.task('pl:full', false, plFullDependencies, plBuild);

    watch.push('watch:pl');
    compile.push('pl:full');
  };
}))();
