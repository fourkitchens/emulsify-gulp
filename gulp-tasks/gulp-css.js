/* globals require */

(function () {

  'use strict';

  // SCSS/CSS
  var sass = require('gulp-sass');
  var sassGlob = require('gulp-sass-glob');
  var sourcemaps = require('gulp-sourcemaps');
  var sassLint = require('gulp-sass-lint');
  var prefix = require('gulp-autoprefixer');
  var cached = require('gulp-cached');
  var plumber = require('gulp-plumber');
  var notify = require('gulp-notify');
  var flatten = require('gulp-flatten');
  var gulpif = require('gulp-if');
  var sassdoc = require('sassdoc');
  var del = require('del');

  module.exports = function (gulp, config, tasks, browserSync) {

    function cssCompile(done) {
      gulp.src(config.cssConfig.src)
      .pipe(sassGlob())
      .pipe(plumber({
        errorHandler: function (error) {
          notify.onError({
            title: 'CSS <%= error.name %> - Line <%= error.line %>',
            message: '<%= error.message %>'
          })(error);
          this.emit('end');
        }
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
      .pipe(sassLint())
      .pipe(sassLint.format())
      .pipe(gulpif(config.cssConfig.lint.failOnError, sassLint.failOnError()));
    });

    gulp.task('docs:css', 'Build CSS docs using SassDoc', function () {
      return gulp.src(config.cssConfig.src)
      .pipe(sassdoc({
        dest: config.cssConfig.sassdoc.dest,
        verbose: config.cssConfig.sassdoc.verbose,
        basePath: config.cssConfig.sassdoc.basePath,
        exclude: config.cssConfig.sassdoc.exclude,
        theme: config.cssConfig.sassdoc.theme,
        sort: config.cssConfig.sassdoc.sort
      }));
    });

    gulp.task('clean:docs:css', 'Delete compiled CSS docs', function (done) {
      del([
        config.cssConfig.sassdoc.dest
      ]).then(function () {
        done();
      });
    });

    gulp.task('watch:css', function () {
      var tasks = ['css'];
      if (config.cssConfig.lint.enabled) {
        tasks.push('validate:css');
      }
      if (config.cssConfig.sassdoc.enabled) {
        tasks.push('docs:css');
      }
      return gulp.watch(config.cssConfig.src, tasks);
    });

    tasks.watch.push('watch:css');

    var cssDeps = [];

    gulp.task('css:full', false, cssDeps, cssCompile);

    if (config.cssConfig.lint.enabled) {
      tasks.validate.push('validate:css');
    }

    if (config.cssConfig.sassdoc.enabled) {
      tasks.compile.push('docs:css');
      tasks.clean.push('clean:docs:css');
    }

    tasks.clean.push('clean:css');

  };

})();
