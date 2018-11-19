const fs = require('fs');
const pa11y = require('pa11y');
// eslint-disable-next-line
const pa11yCli = require('pa11y-reporter-cli');

function pa11yRun(pa11yUrl, config) {
  pa11y(pa11yUrl, {
    includeNotices: config.pa11y.includeNotices,
    includeWarnings: config.pa11y.includeWarnings,
    ignore: config.pa11y.ignore
  }).then((results) => {
    if (results.issues === undefined || results.issues.length < 1) {
      console.log('[pa11y] No accessibility issues found!');
    } else {
      console.log(pa11yCli.results(results));
    }
  });
}

/**
 * Accessibility Testing
 */

// Accessibility testing via pa11y.
function pa11yTest(path, browserSync, config) {
  // Get local url.
  const localUrl = browserSync.getOption('urls').get('local');
  const filePath = path;
  // Get remaining path after ../_patterns/.
  const pLPath = filePath.split('_patterns/').pop();
  // Change remaining path string to array.
  const fileArray = pLPath.split('/');
  // Remove filename (just want directory).
  fileArray.splice(-1, 1);

  // CSS returns a couple of paths and causes duplication.
  if (filePath.split('/').includes('pattern-lab')) {
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
          const pa11yPath = `${localUrl}patterns/${arraytoPathTweak}/${arraytoPathTweak}.html`;
          console.log(`Running accessibility tests on ${pa11yPath}`);
          pa11yRun(pa11yPath, config);
        }
      });
    });
  }
}

module.exports.pa11yTest = pa11yTest;
