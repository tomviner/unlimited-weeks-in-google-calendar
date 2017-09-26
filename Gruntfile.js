/* global module */
module.exports = function(grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // to keep things simple we concat then lint the output
        // to keep jQuery out of this, we add it in the extention's manifest.json
        concat: {
            dist: {
                src: [
                    'js/gcalendar.js',
                    'js/unlimted_weeks.js'
                ],
                dest: 'ext/src/inject/compiled.js',
            }
        },

        uglify: {
            build: {
                src: 'ext/src/inject/compiled.js',
                dest: 'ext/src/inject/compiled.min.js'
            }
        },

        watch: {
            scripts: {
                files: ['Gruntfile.js', 'js/*.js'],
                tasks: ['concat', 'jshint', 'uglify'],
                options: {
                    spawn: false,
                    reload: true
                },
            }
        },

        jshint: {
            all: ['Gruntfile.js', 'ext/src/inject/compiled.js'],
            options : {
                "esversion": 6,
                "asi": true ,
                "browser": true,
                "jquery": true,
                "globals": {
                    "chrome": true
                },
                "devel": true,
                "undef": true,
                "curly": true,
                "varstmt": true,
                "maxcomplexity": 10,
                "maxdepth": 2,
                "strict": "implied",
                "unused": true
            }
        },

        commands: {
            build: {
                cmd: './make-package.sh'
            },
            test: {
                cmd: 'pytest'
            },
        },

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-commands');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['concat', 'jshint', 'uglify']);
    grunt.registerTask('dev', ['watch']);
    grunt.registerTask('build', ['default', 'commands:build']);
    grunt.registerTask('test', ['commands:test']);

};