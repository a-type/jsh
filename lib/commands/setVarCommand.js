"use strict";
var BaseCommand  = require("./baseCommand");
var Bluebird     = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var utils        = require("util");
var _            = require("lodash");

function SetVarCommand (commandString, existingCwd, existingEnv) {
	BaseCommand.call(this);
}

utils.inherits(SetVarCommand, BaseCommand);

SetVarCommand.prototype._runCommand = function () {
	// parse set statement
	_.each(this.args, function (arg) {
		var tokens = arg.split("=");
		process.env[tokens[0]] = tokens[1];
	});

	return Bluebird.resolve(0); // cannot fail
}

SetVarCommand.COMMAND_NAMES = [ /set/i, /export/i ];

module.exports = SetVarCommand;
