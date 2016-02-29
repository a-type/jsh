'use strict';
let gulp = require('gulp');
let babel = require('gulp-babel');
let istanbul = require('gulp-babel-istanbul');
let injectModules = require('gulp-inject-modules');
let mocha = require('gulp-mocha');

gulp.task('coverage', function (cb) {
	gulp.src('lib/**/*.js')
	.pipe(istanbul())
	.pipe(istanbul.hookRequire())
	.on('finish', function () {
		gulp.src('test/**/*.js')
		.pipe(babel())
		.pipe(injectModules())
		.pipe(mocha())
		.pipe(istanbul.writeReports())
		.on('end', cb);
	});
});

gulp.task('test', [ 'coverage' ]);
