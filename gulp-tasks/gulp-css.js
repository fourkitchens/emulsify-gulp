/* globals require */
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const sourcemaps = require('gulp-sourcemaps');
const stylelint = require('gulp-stylelint');
const prefix = require('gulp-autoprefixer');
const cached = require('gulp-cached');
const flatten = require('gulp-flatten');
const gulpif = require('gulp-if');
const cleanCSS = require('gulp-clean-css');
const del = require('del');

((() => {
  module.exports = (gulp, { cssConfig, debug }, { watch, validate, clean }, browserSync) => {
    function cssCompile(done) {
      gulp.src(cssConfig.src)
        .pipe(sassGlob())
        .pipe(stylelint({
          failAfterError: false,
          reporters: [{
            formatter: 'string', console: true,
          }],
        }))
        .pipe(sourcemaps.init({ debug }))
        .pipe(sass({
          outputStyle: cssConfig.outputStyle,
          sourceComments: cssConfig.sourceComments,
          // eslint-disable-next-line global-require
          includePaths: require('node-normalize-scss').with(cssConfig.includePaths),
        }).on('error', sass.logError))
        .pipe(prefix(cssConfig.autoPrefixerBrowsers))
        .pipe(sourcemaps.init())
        .pipe(cleanCSS())
        .pipe(sourcemaps.write((cssConfig.sourceMapEmbed) ? null : './'))
        .pipe(gulpif(cssConfig.flattenDestOutput, flatten()))
        .pipe(gulp.dest(cssConfig.dest))
        .on('end', () => {
          browserSync.reload('*.css');
          done();
        });
    }

    gulp.task('css', 'Compile Scss to CSS using Libsass with Autoprefixer and SourceMaps', cssCompile);

    gulp.task('clean:css', 'Delete compiled CSS files', (done) => {
      del([
        `${cssConfig.dest}*.{css,css.map}`,
      ]).then(() => {
        done();
      });
    });

    gulp.task('validate:css', 'Lint Scss files', () => {
      let src = cssConfig.src;
      if (cssConfig.lint.extraSrc) {
        src = src.concat(cssConfig.lint.extraSrc);
      }
      return gulp.src(src)
        .pipe(cached('validate:css'))
        .pipe(stylelint({
          reporters: [{
            formatter: 'string', console: true,
          }],
        }));
    });

    gulp.task('watch:css', () => {
      const tasks = ['css'];
      if (cssConfig.lint.enabled) {
        tasks.push('validate:css');
      }
      return gulp.watch(cssConfig.src, tasks);
    });

    watch.push('watch:css');

    const cssDeps = [];

    gulp.task('css:full', false, cssDeps, cssCompile);

    if (cssConfig.lint.enabled) {
      validate.push('validate:css');
    }

    clean.push('clean:css');
  };
}))();
