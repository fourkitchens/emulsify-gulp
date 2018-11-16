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
  const fs = require('fs');
  const pa11y = require('pa11y');
  // eslint-disable-next-line
  const pa11yCli = require('pa11y-reporter-cli');

  // eslint-disable-next-line no-redeclare, no-var
  var config = _.defaultsDeep(config, defaultConfig);

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
    gulp
      .src(config.paths.js)
      .pipe(sourcemaps.init())
      .pipe(
        babel({
          presets: ['env', 'minify'],
        })
      )
      .pipe(sourcemaps.write(config.themeDir))
      .pipe(gulp.dest(config.paths.dist_js));
  });

  /**
   * Task for minifying images.
   */
  gulp.task('imagemin', () => {
    gulp
      .src(config.paths.img)
      .pipe(
        imagemin([
          imagemin.jpegtran({ progressive: true }),
          imagemin.svgo({
            plugins: [{ removeViewBox: false }, { cleanupIDs: false }],
          }),
        ])
      )
      .pipe(gulp.dest(file => file.base));
  });

  tasks.compile.push('imagemin');

  /**
   * Task for generating icon colors/png fallbacks from svg.
   */
  gulp.task('icons', () => {
    gulp
      .src('**/*.svg', { cwd: `${config.paths.icons}` })
      .pipe(svgSprite(config.iconConfig))
      .pipe(gulp.dest('.'));
  });

  tasks.compile.push('icons');

  /**
   * Accessibility Testing
   */
  function pa11yRun(pa11yUrl) {
    pa11y(pa11yUrl, {
      includeNotices: true,
      includeWarnings: true,
      ignore: [
        'WCAG2AA.Principle2.Guideline2_4.2_4_2.H25.2',
        'WCAG2AA.Principle2.Guideline2_4.2_4_2.H25.1.NoTitleEl',
        'WCAG2AA.Principle3.Guideline3_1.3_1_1.H57.2',
      ]
    }).then((results) => {
      if (results.issues === undefined || results.issues.length < 1) {
        console.log('[pa11y] No accessibility issues found!');
      } else {
        console.log(pa11yCli.results(results));
      }
    });
  }

  function pa11yTest(path) {
    // Accessibility.
    const localUrl = browserSync.getOption('urls').get('local');
    const filePath = path;
    // Get path past ../_patterns/.
    const pLPath = filePath.split('_patterns/').pop();
    // Change remaining path to array.
    const fileArray = pLPath.split('/');

    // Below is specific to scss files.
    // Remove last item (get file itself).
    const fileArrayLast = fileArray.pop();
    // Get file extension.
    const fileExtension = fileArrayLast.split('.').pop();
    if (fileExtension === 'scss') {
      const fileDir = `${filePath.split('_patterns/')[0]}_patterns/${fileArray.join('/')}`;
      fs.readdir(fileDir, (err, items) => {
        items.forEach((item) => {
          if (item.split('.').pop() === 'twig') {
            // Change array to string separated by dash.
            const twigFilePath = `${fileDir}/${item}`;
            const twigFilePlPath = twigFilePath.split('_patterns/').pop();
            const filetoArray = twigFilePlPath.split('/');
            const arraytoPath = filetoArray.join('-');
            const arraytoPathTweak = arraytoPath.slice(0, -5);
            pa11yRun(`${localUrl}patterns/${arraytoPathTweak}/${arraytoPathTweak}.html`);
          }
        });
      });
    } else {
      // Change array to string separated by dash.
      const arraytoPath = fileArray.join('-');
      // Remove file extension.
      const arraytoPathTweak = arraytoPath.slice(0, -5);
      pa11yRun(`${localUrl}patterns/${arraytoPathTweak}/${arraytoPathTweak}.html`);
    }
  }

  // Find open port using portscanner.
  let openPort = '';
  portscanner.findAPortNotInUse(3000, 3010, '127.0.0.1', (error, port) => {
    openPort = port;
  });

  // Pattern Lab
  require('./gulp-tasks/gulp-pattern-lab.js')(gulp, config, tasks, browserSync, openPort);

  /**
   * Task for running browserSync.
   */
  gulp.task('serve', ['css', 'scripts', 'watch:pl'], () => {
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
    gulp.watch(config.paths.js, ['scripts']).on('change', (event) => {
      browserSync.reload();
      pa11yTest(event.path);
    });
    gulp.watch(`${config.paths.sass}/**/*.scss`, ['css']).on('change', (event) => {
      pa11yTest(event.path);
    });
    gulp.watch(config.patternLab.scssToYAML[0].src, ['pl:scss-to-yaml']);
  });

  /**
   * Theme task declaration
   */
  gulp.task('theme', ['serve']);

  gulp.task('compile', tasks.compile);
  gulp.task('validate', tasks.validate);
  gulp.task('watch', tasks.watch);
  tasks.default.push('watch');
  gulp.task('default', tasks.default);

  /**
   * Theme task declaration
   */
  gulp.task('build', ['imagemin', 'scripts', 'css', 'icons']);

  /**
   * Deploy
   */
  gulp.task('ghpages-deploy', () => {
    // Create build directory.
    gulp
      .src(
        [
          `${config.paths.dist_js}/**/*`,
          `${config.paths.pattern_lab}/**/*`,
          `${config.themeDir}/CNAME`,
        ],
        { base: config.themeDir }
      )
      .pipe(gulp.dest('build'));
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
