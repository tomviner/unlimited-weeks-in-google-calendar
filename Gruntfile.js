/* global module */
module.exports = function(grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                src: [
                    'js/libs/*.js', // All JS in the libs folder
                    'js/inject.js'  // This specific file
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
                tasks: ['jshint', 'concat', 'uglify'],
                options: {
                    spawn: false,
                    reload: true
                },
            }
        },

        jshint: {
            all: ['Gruntfile.js', 'js/**/*.js', '!js/libs/*.js'],
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
            run_shell: {
                cmd: './make-package.sh'
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
    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
    grunt.registerTask('dev', ['watch']);
    grunt.registerTask('build', ['commands']);

};