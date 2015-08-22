"use strict";
var BaseCommand  = require("./baseCommand");
var Bluebird     = require("bluebird");
var util        = require("util");

function ChangeLocCommand () {
	BaseCommand.call(this, arguments);
}

util.inherits(ChangeLocCommand, BaseCommand);

ChangeLocCommand.prototype._runCommand = function () {
	var self = this;

	return new Bluebird(function (resolve) {
		try {
			process.chdir(self.args[0]);
			resolve(0);
		}
		catch (err) {
			self._error(err);
			resolve(1);
		}
	});
};

ChangeLocCommand.COMMAND_NAMES = [ /cd/i ];

module.exports = ChangeLocCommand;
