/* globals module */

(function () {
  'use strict';

  var themeDir = 'themes/contrib/fourk';
  var paths = {
    js: themeDir + '/js/**/*.js',
    styleguide_js: [
      themeDir + '/js/**/*.js',
      themeDir + '/source/_patterns/**/*.js'
    ],
    dist_js: themeDir + '/dist',
    sass: themeDir,
    img: themeDir + '/images',
    dist_css: themeDir + '/dist/css',
    dist_img: themeDir + '/dist/img'
  };

  module.exports = {
    host: 'http://127.0.0.1:8888/',
    themeDir: themeDir,
    paths: paths,
    sassOptions: {
      outputStyle: 'expanded',
      eyeglass: {
        enableImportOnce: false
      },
      drupalSassBreakpoints: {
        themePath: themeDir + '/'
      }
    },
    cssConfig: {
      enabled: true,
      src: themeDir + '/source/**/*.scss',
      dest: themeDir + '/dist/',
      flattenDestOutput: true,
      lint: {
        enabled: false,
        failOnError: true
      },
      sourceComments: false,
      sourceMapEmbed: false,
      outputStyle: 'expanded',
      autoPrefixerBrowsers: [
        'last 2 versions',
        '- IE >= 9'
      ],
      includePaths: (['./node_modules']),
      sassdoc: {
        enabled: true,
        dest: themeDir + '/dist/sassdoc',
        verbose: false,
        sort: [
          'file',
          'group',
          'line'
        ]
      }
    },
    iconConfig: {
      shape: {
        dimension: {
          maxWidth: 15,
          maxHeight: 15
        },
        spacing: {         // Add padding
          padding: 10
        }
      },
      mode: {
        css: {
          bust: false,
          dest: '../../dist',
          prefix: '@mixin sprite-%s',
          render: {
            scss: {
              dest: '../source/_patterns/01-atoms/04-images/_icon_sprite.scss',
              template: 'gulp-tasks/svg-icons/sprite.scss.handlebars'
            }
          }
        }
      }
    },
    patternLab: {
      enabled: true,
      configFile: 'pattern-lab/config/config.yml',
      watchedExtensions: (['twig', 'json', 'yaml', 'yml', 'md', 'jpg', 'jpeg', 'png']),
      scssToJson: [
        {
          src: themeDir + '/source/_patterns/00-base/global/01-colors/_color-vars.scss',
          dest: themeDir + '/source/_patterns/00-base/global/01-colors/colors.json',
          lineStartsWith: '$',
          allowVarValues: false
        }
      ]
    },
    browserSync: {
      enabled: true,
      domain: '127.0.0.1:8888',
      startPath: 'pattern-lab/public/index.html',
      reloadDelay: 50,
      reloadDebounce: 750
    }
  };
})();
