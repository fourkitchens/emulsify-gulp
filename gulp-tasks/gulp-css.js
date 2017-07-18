/* globals require */

(function () {

  'use strict';

  // SCSS/CSS
  var sass = require('gulp-sass');
  var sassGlob = require('gulp-sass-glob');
  var sourcemaps = require('gulp-sourcemaps');
  var stylelint = require('gulp-stylelint')
  var prefix = require('gulp-autoprefixer');
  var cached = require('gulp-cached');
  var plumber = require('gulp-plumber');
  var notify = require('gulp-notify');
  var flatten = require('gulp-flatten');
  var gulpif = require('gulp-if');
  var cleanCSS = require('gulp-clean-css');
  var del = require('del');

  module.exports = function (gulp, config, tasks, browserSync) {

    function cssCompile(done) {
      gulp.src(config.cssConfig.src)
      .pipe(sassGlob())
      .pipe(stylelint({
        failAfterError: false,
        reporters: [{
          formatter: 'string', console: true
        }]
      }))
      .pipe(sourcemaps.init({
        debug: config.debug
      }))
      .pipe(sass({
        outputStyle: config.cssConfig.outputStyle,
        sourceComments: config.cssConfig.sourceComments,
        includePaths: require('node-normalize-scss').with(config.cssConfig.includePaths)
      }).on('error', sass.logError))
      .pipe(prefix(['last 1 version', '> 1%', 'ie 10']))
      .pipe(sourcemaps.init())
      .pipe(cleanCSS())
      .pipe(sourcemaps.write((config.cssConfig.sourceMapEmbed) ? null : './'))
      .pipe(gulpif(config.cssConfig.flattenDestOutput, flatten()))
      .pipe(gulp.dest(config.cssConfig.dest))
      .on('end', function () {
        done();
      });
    }

    gulp.task('css', 'Compile Scss to CSS using Libsass with Autoprefixer and SourceMaps', cssCompile);

    gulp.task('clean:css', 'Delete compiled CSS files', function (done) {
      del([
        config.cssConfig.dest + '*.{css,css.map}'
      ]).then(function () {
        done();
      });
    });

    gulp.task('validate:css', 'Lint Scss files', function () {
      var src = config.cssConfig.src;
      if (config.cssConfig.lint.extraSrc) {
        src = src.concat(config.cssConfig.lint.extraSrc);
      }
      return gulp.src(src)
      .pipe(cached('validate:css'))
      .pipe(stylelint({
        reporters: [{
          formatter: 'string', console: true
        }]
      }))
    });

    gulp.task('watch:css', function () {
      var tasks = ['css'];
      if (config.cssConfig.lint.enabled) {
        tasks.push('validate:css');
      }
      return gulp.watch(config.cssConfig.src, tasks);
    });

    tasks.watch.push('watch:css');

    var cssDeps = [];

    gulp.task('css:full', false, cssDeps, cssCompile);

    if (config.cssConfig.lint.enabled) {
      tasks.validate.push('validate:css');
    }

    tasks.clean.push('clean:css');

  };

})();
