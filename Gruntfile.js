"use strict";

module.exports = function (grunt) {
	var _ = grunt.util._;

	var sourceFiles = [ "*.js", "lib/**/*.js" ];
	var testFiles   = [ "test/**/*.js" ];
	var jsFiles     = sourceFiles.concat(testFiles);

	var defaultJsHintOptions = grunt.file.readJSON("./.jshint.json");
	var testJsHintOptions = _.defaults(
		grunt.file.readJSON("./test/.jshint.json"),
		defaultJsHintOptions
	);

	grunt.initConfig({
		jscs : {
			src     : jsFiles,
			options : {
				config : ".jscsrc"
			}
		},

		jshint : {
			src     : sourceFiles,
			options : defaultJsHintOptions,
			test    : {
				options : testJsHintOptions,
				files   : {
					test : testFiles
				}
			}
		},

		mochaIstanbul : {
			coverage : {
				src     : "test/unit",
				options : {
					mask      : "**/*_spec.js",
					recursive : true
				}
			}
		},

		mochaTest : {
			integration : {
				options : {
					reporter : "spec",
					timeout  : 4000
				},

				src : [ "test/integration/**/*_spec.js" ]
			},
			unit        : {
				options : {
					reporter : "spec"
				},

				src : [ "test/unit/**/*_spec.js" ]
			}
		},

		clean : [ "coverage" ]
	});

	// Load plugins
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-mocha-istanbul");
	grunt.loadNpmTasks("grunt-mocha-test");

	// Rename tasks
	grunt.task.renameTask("mocha_istanbul", "mochaIstanbul");

	// Register tasks
	grunt.registerTask("test", [ "clean", "mochaIstanbul:coverage" ]);
	grunt.registerTask("lint", "Check for common code problems.", [ "jshint" ]);
	grunt.registerTask("style", "Check for style conformity.", [ "jscs" ]);
	grunt.registerTask("integration", "Run integration tests", [ "mochaTest:integration" ]);

	grunt.registerTask("default", [ "clean", "lint", "style", "test" ]);
};
