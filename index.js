/* globals require */

module.exports = (gulp, config) => {
  // General
  // eslint-disable-next-line no-redeclare, no-var
  var gulp = require('gulp-help')(gulp);
  const _ = require('lodash');
  const portscanner = require('portscanner');
  const browserSync = require('browser-sync').create();
  const babel = require('gulp-babel');
  const sourcemaps = require('gulp-sourcemaps');
  const defaultConfig = require('./gulp-config');

  // eslint-disable-next-line no-redeclare, no-var
  var config = _.defaultsDeep(config, defaultConfig);

  // scripts
  const concat = require('gulp-concat');

  // Image Minification
  const imagemin = require('gulp-imagemin');

  // icons
  const svgSprite = require('gulp-svg-sprite');

  // deploy
  const ghpages = require('gh-pages');

  const tasks = {
    compile: [],
    watch: [],
    validate: [],
    clean: [],
    default: [],
  };

  // SCSS/CSS
  require('./gulp-tasks/gulp-css.js')(gulp, config, tasks, browserSync);

  // Tests
  require('./gulp-tasks/gulp-tests.js')(gulp, config, tasks);

  /**
   * Script Task
   */
  gulp.task('scripts', () => {
    gulp.src(config.paths.js)
      .pipe(sourcemaps.init())
      .pipe(babel({
        presets: ['env'],
      }))
      .pipe(sourcemaps.write(config.themeDir))
      .pipe(gulp.dest(config.paths.dist_js));
  });

  gulp.task('styleguide-scripts', () => {
    gulp.src(config.paths.js)
      .pipe(sourcemaps.init())
      .pipe(babel({
        presets: ['env'],
      }))
      // Concatenate everything within the JavaScript folder.
      .pipe(concat('scripts-styleguide.js'))
      .pipe(sourcemaps.write(config.themeDir))
      .pipe(gulp.dest(config.paths.dist_js));
  });

  /**
   * Task for minifying images.
   */
  gulp.task('imagemin', () => {
    gulp.src(`${config.paths.img}/**/*`)
      .pipe(imagemin({
        progressive: true,
        svgoPlugins: [
          { removeViewBox: false },
          { cleanupIDs: false },
        ],
      }))
      .pipe(gulp.dest(config.paths.dist_img));
  });

  /**
   * Task for generating icon colors/png fallbacks from svg.
   */
  gulp.task('icons', () => {
    gulp.src('**/*.svg', { cwd: `${config.paths.img}/icons/src` })
      .pipe(svgSprite(config.iconConfig))
      .pipe(gulp.dest(`${config.themeDir}/images/icons`));
  });

  tasks.compile.push('icons');

  // Pattern Lab
  require('./gulp-tasks/gulp-pattern-lab.js')(gulp, config, tasks, browserSync);

  // Find open port using portscanner.
  let openPort = '';
  portscanner.findAPortNotInUse(3000, 3010, '127.0.0.1', (error, port) => {
    openPort = port;
  });

  /**
   * Task for running browserSync.
   */
  gulp.task('serve', ['css', 'scripts', 'styleguide-scripts', 'watch:pl'], () => {
    if (config.browserSync.domain) {
      browserSync.init({
        injectChanges: true,
        open: config.browserSync.openBrowserAtStart,
        proxy: config.browserSync.domain,
        startPath: config.browserSync.startPath,
      });
    } else {
      browserSync.init({
        injectChanges: true,
        server: {
          baseDir: config.browserSync.baseDir,
        },
        startPath: config.browserSync.startPath,
        notify: config.browserSync.notify,
        ui: config.browserSync.ui,
        open: config.browserSync.openBrowserAtStart,
        reloadOnRestart: config.browserSync.reloadOnRestart,
        port: openPort,
      });
    }
    gulp.watch(config.paths.js, ['scripts', 'styleguide-scripts']).on('change', browserSync.reload);
    gulp.watch(`${config.paths.sass}/**/*.scss`, ['css']);
    gulp.watch(config.patternLab.scssToYAML[0].src, ['pl:scss-to-yaml']);
  });

  /**
   * Theme task declaration
   */
  gulp.task('theme', ['serve']);

  gulp.task('compile', tasks.compile);
  gulp.task('clean', tasks.clean);
  gulp.task('validate', tasks.validate);
  gulp.task('watch', tasks.watch);
  tasks.default.push('watch');
  gulp.task('default', tasks.default);

  /**
   * Theme task declaration
   */
  gulp.task('build', ['imagemin', 'clean', 'scripts', 'styleguide-scripts', 'css', 'icons']);

  /**
   * Deploy
   */
  gulp.task('ghpages-deploy', () => {
    // Create build directory.
    gulp.src([`${config.paths.dist_js}/**/*`, `${config.paths.pattern_lab}/**/*`], { base: config.themeDir }).pipe(gulp.dest('build'));
    // Publish the build directory to github pages.
    ghpages.publish(`${config.themeDir}build`, (err) => {
      if (err === undefined) {
        console.log('Successfully deployed!');
      } else {
        console.log(err);
      }
    });
  });
};
