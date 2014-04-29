// # Gulp.js Build configuration file

var gulp = require('gulp'),
    watch = require('gulp-watch'),
    clean = require('gulp-clean'),
    jshint = require('gulp-jshint');

gulp.task('lint', function() {
    gulp.src('./lib/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

// ## Watch for changes
gulp.task('watch', function() {
    gulp.watch('./lib/**/*.js', function() {
        gulp.run('lint');
    });
});

// ## Default task
gulp.task('default', ['lint', 'watch']);
