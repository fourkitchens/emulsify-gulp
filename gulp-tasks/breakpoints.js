/* globals require, process */

(function () {

  "use strict";

  var path = require('path');
  var fs   = require('fs-extra');
  var glob = require('glob');
  var yaml = require('js-yaml');
  var breakpointsFile;
  var breakpoints = [];

  /**
   * Custom Function to get the value of a media query
   * from our .breakpoints.yml.
   *
   * @param {String} targetLabel
   *   The human readable name of the 'label' key for the breakpoint.
   * @param {String} targetGroup
   *   The name prefixes the breakpoint group name. For example: if the breakpoint
   *   was `foo.bar: { ...` then the group name is "foo".
   */
  var getMediaQuery = function(targetLabel, targetGroup) {
    // Loop over all our breakpoints.
    for(var breakpoint in breakpoints) {
      // Get the contents of the current breakpoint.
      var currentBreakpoint = breakpoints[breakpoint];

      // If a the value of group is not empty.
      if (targetGroup.length) {
        // Get the current breakpoint group we are on.
        var currentGroup = breakpoint.match(/^([\w\-]+)/);

        // If the current group matches the target group
        // then return the query.
        if (currentGroup[0] === targetGroup) {
          if (currentBreakpoint.label === targetLabel) {
            return currentBreakpoint.mediaQuery;
          }
        }
      }

      // If no group is listed, just return the media query for
      // the 1st item that matches our target label
      else if (currentBreakpoint.label === targetLabel) {
        return currentBreakpoint.mediaQuery;
      }
    }
  }

  module.exports = function(sassOptions, sass) {
    var dsbOptions = sassOptions.drupalSassBreakpoints || process.env.PWD;
    var themePath = dsbOptions.themePath || process.env.PWD;
    breakpointsFile = glob.sync('*.breakpoints.yml', {'cwd': themePath});

    if (breakpointsFile.length) {
      breakpoints = yaml.safeLoad(fs.readFileSync(themePath + breakpointsFile[0], 'utf8'));
    }
    else {
      console.log('No breakpoints file found. You may need to add \ndrupalSassBreakpoints: {\n\tthemePath: \'/path/to/theme\'\n}\nto your the SASS options passed to Eyeglass.');
    }
    return {
      sassDir: path.join(__dirname, 'sass'),
      functions: {
        "dsb($label, $group: '')": function(label, group, done) {
          var label = label.getValue();
          var group = group.getValue();

          var mediaQuery = getMediaQuery(label, group);
          // If no media query is found then throw an error.
          if (typeof mediaQuery !== 'undefined') {
            done(sass.types.String(getMediaQuery(label, group)));
          }
          else {
            throw 'Unable to find a breakpoint within the "' + group + '" group with a label of "' + label + '" in the file ' + breakpointsFile + '.';
          }
        }
      }
    }
  };

})();
