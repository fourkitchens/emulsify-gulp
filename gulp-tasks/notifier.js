/* globals require, process */

const exec = require('child_process').exec;
const notifier = require('node-notifier');

((() => {
  function sh(cmd, exitOnError, cb) {
    const child = exec(cmd, { encoding: 'utf8' });
    let stdout = '';
    // eslint-disable-next-line no-unused-vars
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data;
      process.stdout.write(data);
    });
    child.stderr.on('data', (data) => {
      stderr += data;
      process.stdout.write(data);
    });
    child.on('close', (code) => {
      if (code > 0) {
        // eslint-disable-next-line no-console
        console.log(`Error with code ${code} after running: ${cmd}`);
        if (exitOnError) {
          process.exit(code);
        } else {
          notifier.notify({
            title: cmd,
            message: stdout,
            sound: true,
          });
        }
      }
      cb();
    });
  }

  module.exports = {
    sh,
  };
}))();
