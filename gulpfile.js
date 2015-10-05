// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var livereload = require('gulp-livereload');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('client/scripts/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Sass
gulp.task('sass', function() {
    return gulp.src('client/styles/style.scss')
        .pipe(sass())
        .pipe(gulp.dest('server/public/assets/styles'))
        .pipe(livereload());
});

// project JS
gulp.task('scripts-index', function() {
    return gulp.src('client/scripts/**/*.js')
        .pipe(uglify())
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(gulp.dest('server/public/assets/scripts'))
        .pipe(livereload());
});

// Copy Client Views to Public Assets
gulp.task('views', function() {
   return gulp.src('client/views/**/*.html')
       .pipe(gulp.dest('server/public/assets/views'))
       .pipe(livereload());
});

// Copy Client Images to Public Assets
gulp.task('images', function() {
    return gulp.src('client/images/**/*')
        .pipe(gulp.dest('server/public/assets/images'))
        .pipe(livereload());
});

// Copy Node Modules to Public Vendors
gulp.task('copy-vendors', function() {
    gulp.src(['node_modules/bootstrap/dist/css/bootstrap.min.css', 'node_modules/bootstrap/dist/css/bootstrap.css.map'])
        .pipe(gulp.dest('server/public/vendors/bootstrap'));
    gulp.src(['node_modules/bootstrap/dist/fonts/*'])
        .pipe(gulp.dest('server/public/vendors/fonts'));
    gulp.src(['node_modules/angular/angular.min.js','node_modules/angular/angular.min.js.map'])
        .pipe(gulp.dest('server/public/vendors/angular'));
    gulp.src(['node_modules/angular-route/angular-route.min.js','node_modules/angular-route/angular-route.min.js.map'])
        .pipe(gulp.dest('server/public/vendors/angular-route'));
    gulp.src(['node_modules/angular-ui-bootstrap/ui-bootstrap.min.js','node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.min.js'])
        .pipe(gulp.dest('server/public/vendors/angular-ui-bootstrap'));
    gulp.src(['node_modules/angular-animate/angular-animate.min.js','node_modules/angular-animate/angular-animate.min.js.map'])
        .pipe(gulp.dest('server/public/vendors/angular-animate'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    livereload.listen();
    gulp.watch('client/scripts/**/*.js', ['lint', 'scripts-index']);
    gulp.watch('client/styles/*.scss', ['sass']);
    gulp.watch('client/views/**/*.html', ['views']);
    gulp.watch('client/images/**/*', ['images']);
});

// Default Task
gulp.task('default', ['lint', 'sass', 'scripts-index', 'views', 'images', 'copy-vendors', 'watch']);
