/* globals require, process, __dirname */
const ngrok = require('ngrok');
const psi = require('psi');
const wpt = require('webpagetest');

((() => {
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
      ngrok.connect(4000, (errNgrok, url) => {
        // eslint-disable-next-line no-console
        console.log(`ngrok - serving your site from ${url}`);

        // Run PageSpeed once the tunnel is up.
        psi.output(url, {
          strategy: 'mobile',
          threshold: 90,
        }, (errPsi) => {
          // Log any potential errors and return a FAILURE.
          if (errPsi) {
            // eslint-disable-next-line no-console
            console.log(errPsi);
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
        const wptTest = wpt('www.webpagetest.org', config.wpt.key);

        // Set up a public tunnel so WebPageTest can see the local site.
        ngrok.connect(4000, (errNgrok, url) => {
          // eslint-disable-next-line no-console
          console.log(`ngrok - serving your site from ${url}`);

          // The `url` variable was supplied by ngrok.
          wptTest.runTest(url, (errWpt, { data }) => {
            // Log any potential errors and return a FAILURE.
            if (errWpt) {
              // eslint-disable-next-line no-console
              console.log(errWpt);
              process.exit(1);
            }

            // Open window to results.
            const wptResults = `http://www.webpagetest.org/result/${data.testId}`;
            // eslint-disable-next-line no-console
            console.log(`✔︎  Opening results page: ${wptResults}`);

            // Note to developer.
            /* eslint-disable no-console */
            console.log('⚠️  Please keep this process running until WPT is finished.');
            console.log('⚠️  Once the results load, hit Control + C to kill this process.');
            /* eslint-enable no-console */
          });
        });
      // eslint-disable-next-line no-else-return
      } else {
        // eslint-disable-next-line no-console
        console.log('Missing wptkey env variable.');
      }
    });

    gulp.task('qa', 'Run all quality checks and tests.', ['psi', 'wpt']);
  };
}))();
