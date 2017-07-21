/* globals require, process, __dirname */

(function () {

  'use strict';

  // Performance Testing
  const ngrok = require('ngrok');
  const psi = require('psi');
  const wpt = require('webpagetest');
  const spawn = require("gulp-spawn");

  module.exports = (gulp, config) => {

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
    gulp.task('psi', 'Performance: PageSpeed Insights', () => {
      // Set up a public tunnel so PageSpeed can see the local site.
      return ngrok.connect(4000, function (err_ngrok, url) {
        console.log('ngrok - serving your site from ' + url);

        // Run PageSpeed once the tunnel is up.
        psi.output(url, {
          strategy: 'mobile',
          threshold: 90
        }, (err_psi, data) => {
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
    gulp.task('wpt', 'Performance: WebPageTest.org', () => {

      if (config.wpt.key && config.wpt.key !== null) {
        const wpt_test = wpt('www.webpagetest.org', config.wpt.key);

        // Set up a public tunnel so WebPageTest can see the local site.
        return ngrok.connect(4000, (err_ngrok, url) => {
          console.log('ngrok - serving your site from ' + url);

          // The `url` variable was supplied by ngrok.
          wpt_test.runTest(url, (err_wpt, data_wpt) => {
            // Log any potential errors and return a FAILURE.
            if (err_wpt) {
              console.log(err_wpt);
              process.exit(1);
            }

            // Open window to results.
            const wpt_results = 'http://www.webpagetest.org/result/' + data_wpt.data.testId;
            console.log('✔︎  Opening results page: ' + wpt_results);

            // Note to developer.
            console.log('⚠️  Please keep this process running until WPT is finished.');
            console.log('⚠️  Once the results load, hit Control + C to kill this process.');
          });
        });
      } else {
        console.log('Missing wptkey env variable.');
      }
    });

    gulp.task('qa', 'Run all quality checks and tests.', ['psi', 'wpt']);

  };

})();
