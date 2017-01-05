/* globals require, process, __dirname */

(function () {

  'use strict';

  var options = require('minimist')(process.argv.slice(2));
  var fs = require('fs');

  // JS.
  var eslint = require('gulp-eslint');

  // PHP.
  var tap = require('gulp-tap');
  var execSync = require('sync-exec');

  // Performance Testing
  var ngrok = require('ngrok');
  const psi = require('psi');
  var wpt = require('webpagetest');
  var spawn = require("gulp-spawn");

  module.exports = function (gulp, config) {

    gulp.task('eslint', 'Check JavaScript files for coding standards issues.', function () {
      var excludePatterns = config.eslint.excludePatterns;
      var sourcePatterns = [
        '*.js',
        '**/*.js'
      ];
      var patterns = [];

      // If path is provided, override.
      if (options.hasOwnProperty('path') && options.path.length > 0) {
        sourcePatterns = [
          options.path + '/*.js',
          options.path + '/**/*.js'
        ];
      }

      // Merge sourcePatterns with excludePatterns.
      patterns = sourcePatterns.concat(excludePatterns);
      return gulp.src(patterns)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
    }, {
      options: {
        path: 'The path in which to check coding standards.'
      }
    });

    gulp.task('phpcs', 'Check PHP files for coding standards issues.', function () {
      // Source file defaults to a pattern.
      var extensions = '{php,module,inc,install,test,profile,theme}';
      var sourcePatterns = [
        '**/*.' + extensions,
        '*.' + extensions
      ];

      var excludePatterns = [];

      // Get exclude patterns from a .phpcsignore file in the project root.
      if (fs.existsSync('./.phpcsignore')) {
        var contents = fs.readFileSync('./.phpcsignore', 'utf8');

        contents.split('\n').filter(Boolean).forEach(function (item) {
          excludePatterns.push('!' + item);
        });
      }

      // If path is provided, override.
      if (options.hasOwnProperty('path') && options.path.length > 0) {
        sourcePatterns = [
          options.path + '/*.' + extensions,
          options.path + '/**/*.' + extensions
        ];
      }

      // Merge sourcePatterns with excludePatterns.
      var patterns = sourcePatterns.concat(excludePatterns);

      return gulp.src(patterns)
        .pipe(tap(function (file) {
          execSync(__dirname + '/../vendor/bin/phpcs --config-set installed_paths ' + __dirname + '/../vendor/drupal/coder/coder_sniffer');
          var report = execSync(__dirname + '/../vendor/bin/phpcs --standard="./ruleset.xml" ' + file.path);
          if (report.stdout.length > 0) {
            // Log report, and remove silly Code Sniffer 2.0 ad.
            /* eslint-disable */
            console.log(report.stdout.split('UPGRADE TO PHP_CODESNIFFER 2.0 TO FIX ERRORS AUTOMATICALLY')[0]);
            /* eslint-enable */
          }

          if (report.status !== 0 && options.hasOwnProperty('exit')) {
            // Exit with error code.
            /* eslint-disable */
            process.exit(report.status);
            /* eslint-enable */
          }
        }));
    }, {
      options: {
        path: 'The path in which to check coding standards.',
        exit: 'Exit with an error code if phpcs finds errors.'
      }
    });

    gulp.task('lint', 'Run all coding standard and style checking tools.', ['eslint', 'phpcs']);

    // -----------------------------------------------------------------------------
    // Performance test: PageSpeed Insights
    //
    // Initializes a public tunnel so the PageSpeed service can access your local
    // site, then it tests the site. This task outputs the standard PageSpeed results.
    //
    // The task will output a standard exit code based on the result of the PSI test
    // results. 0 is success and any other number is a failure. To learn more about
    // bash-compatible exit status codes read this page:
    //
    // http://tldp.org/LDP/abs/html/exit-status.html
    // -----------------------------------------------------------------------------
    gulp.task('psi', 'Performance: PageSpeed Insights', function() {
      // Set up a public tunnel so PageSpeed can see the local site.
      return ngrok.connect(4000, function (err_ngrok, url) {
        console.log('ngrok - serving your site from ' + url);

        // Run PageSpeed once the tunnel is up.
        psi.output(url, {
          strategy: 'mobile',
          threshold: 90
        }, function (err_psi, data) {
          // Log any potential errors and return a FAILURE.
          if (err_psi) {
            console.log(err_psi);
            process.exit(1);
          }

          // Kill the ngrok tunnel and return SUCCESS.
          process.exit(0);
        });
      });
    });

    // -----------------------------------------------------------------------------
    // Performance test: WebPageTest.org
    //
    // Initializes a public tunnel so the PageSpeed service can access your local
    // site, then it tests the site. This task outputs the standard PageSpeed results.
    // -----------------------------------------------------------------------------
    gulp.task('wpt', 'Performance: WebPageTest.org', function () {
      if (!config.wpt.key) {
        console.log('Missing wptkey env variable.');
      }
      var wpt_test = wpt('www.webpagetest.org', config.wpt.key);

      // Set up a public tunnel so WebPageTest can see the local site.
      return ngrok.connect(4000, function (err_ngrok, url) {
        console.log('ngrok - serving your site from ' + url);

        // The `url` variable was supplied by ngrok.
        wpt_test.runTest(url, function(err_wpt, data_wpt) {
          // Log any potential errors and return a FAILURE.
          if (err_wpt) {
            console.log(err_wpt);
            process.exit(1);
          }

          // Open window to results.
          var wpt_results = 'http://www.webpagetest.org/result/' + data_wpt.data.testId;
          console.log('✔︎  Opening results page: ' + wpt_results);

          // Note to developer.
          console.log('⚠️  Please keep this process running until WPT is finished.');
          console.log('⚠️  Once the results load, hit Control + C to kill this process.');
        });
      });
    });

    gulp.task('qa', 'Run all quality checks and tests.', ['psi', 'wpt']);

  };

})();
