"use strict";
var BaseCommand  = require("./baseCommand");
var Bluebird     = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var utils        = require("util");
var _            = require("lodash");

function ChangeLocCommand (commandString, existingCwd, existingEnv) {
	BaseCommand.call(this);
}

utils.inherits(ChangeLocCommand, BaseCommand);

ChangeLocCommand.prototype._runCommand = function () {
	return new Bluebird(function (resolve) {
		try {
			process.chdir(absolutePath);
			resolve(0);
		}
		catch (err) {
			self._error(err);
			resolve(1);
		}
	});
}

ChangeLocCommand.COMMAND_NAMES = [ /cd/i ];

module.exports = ChangeLocCommand;
