module.exports = function (grunt) {
  'use strict';
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    jshint: { all: ['src/**/*.js'] },
    concat: {
      app: {
        files: [{
          src: 'src/**/*.js',
          dest: 'dist/lorum_logic.js'
        }]
      }
    },
    uglify: {
      app: {
        files: [{
          src: 'dist/lorum_logic.js',
          dest: 'dist/lorum_logic.min.js'
        }]
      }
    }
  });

  grunt.registerTask('default', [
    //'jshint', 
    'concat', 'uglify'
  ]);
};
