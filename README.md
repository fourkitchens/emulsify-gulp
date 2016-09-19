# Fourk gulp
A collection of useful gulp tasks.

## How to use it
* `npm i --save-dev fourkitchens/fourk-gulp`
  * This will install the `master` branch. Please add `#tag/branchname` at the end if you need a certain branch/tag.
* Add the following to your project's gulp file. This will pass gulp and config along to the newly installed tasks.
```
const gulp = require('gulp-help')(require('gulp'));
const _ = require('lodash');
let localConfig = {};

// Attempt to load an optional local configuration file.
try {
  localConfig = require('./local.gulp-config');
}
catch (e) {}

// Load all gulp tasks.
require('fourk-gulp')(gulp, localConfig);
```
* The gulp-config.js file is still used and most likely would be committed to the project repo. The local.gulp-config could be used to override config for your machine and should be gitignored.
* You'll now be able to execute any task in this repo. Run `gulp help` for more info on these tasks.
