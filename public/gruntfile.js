module.exports = function(grunt) {

    grunt.initConfig({
        nodewebkit: {
            options: {
                build_dir: '../webkitbuilds', // Where the build version of my node-webkit app is saved
                mac: true, // We want to build it for mac
                win: true, // We want to build it for win
                linux32: true, // We don't need linux32
                linux64: true // We don't need linux64
            },
            src: './**/*' // Your node-webkit app
        },

        //watch task
        watch: {
            //for javascript files
            javascript: {
                tasks: ['concat:javascript'],
                files: [
                    'src/js.js'
                  ]
            },
            styles: {
              // Which files to watch (all .less files recursively in the less directory)
              files: ['assets/less/**/*.less'],
              tasks: ['less:web','copy'],
              options: {
                nospawn: true
              }
            }
        },

       concat: {
           javascript: {
               src: [
                   'lib/jquery.min.js',
                   'lib/flot/jquery.flot.js',
                   'lib/jsPDF/jspdf.js',
                   'src/js.js'
               ],

               dest: 'src/main.js'
           }
       },

       less: {
          nwApp: {
            options: {
              paths: ["assets/css"],
              compress: true,
              yuicompress: true,
              optimization: 2,
              cleancss: true,
              modifyVars: {
                color1: '#000000',
                color2: '#151515',
                color3: '#3f1619',
                color4: '#602025',
                color5: '#802a30',
                color6: '#a1333c'
              }
            },
            files: {
              "assets/css/main.css": "assets/less/main.less"
            }
          },
          web: {
            options: {
              paths: ["assets/css"],
              compress: true,
              yuicompress: true,
              optimization: 2,
              cleancss: true
            },
            files: {
              "assets/css/main.css": "assets/less/main.less"
            }
          }
        },

        copy: {
            main: {
                nonull: true,
                // src: ['./**/*', '!less', '!gruntfile.js'],
                // dest: '../webbuilds/',
                // files: {
                //   '../webbuilds/': ['./**/*',  '!**/node_modules/**)', '!./assets/!(less)', '!./gruntfile.js', '!./package.json']
                // }
                files: {
                  '../webbuilds/': ['./index.html',  './assets/css/**/*', './src/main.js']
                }
            },
        },
   });

   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-less');
   grunt.loadNpmTasks('grunt-contrib-copy');
   grunt.loadNpmTasks('grunt-node-webkit-builder');

   grunt.registerTask('buildWebsite', ['less:web', 'concat:javascript', 'copy']);
   grunt.registerTask('buildApp', ['less:nwApp', 'concat:javascript', 'nodewebkit']);
   grunt.registerTask('buildAll', ['buildWebsite', 'buildApp']);
};