"use strict";
var BaseCommand      = require("./baseCommand");
var ChangeLocCommand = require("./changeLocCommand");
var SetVarCommand    = require("./setVarCommand");
var _                = require("lodash");

var commandTypes = [
	ChangeLocCommand,
	SetVarCommand
];

commandTypes.push(BaseCommand); // always last

module.exports.fromString = function (commandString) {
	var base = commandString.split(/\s+/)[0];
	var commandType;

	_.each(commandTypes, function (type) {
		_.each(type.COMMAND_NAMES, function (name) {
			if (name.test(base)) {
				commandType = type;
			}
		});
	});

	return commandType;
};

module.exports.BaseCommand = BaseCommand;
module.exports.ChangeLocCommand = ChangeLocCommand;
module.exports.SetVarCommand = SetVarCommand;

module.exports.CHAIN_OPERATORS = [ "|", "||", "&&" ];
module.exports.CHAIN_OPERATOR_MATCH = /\s+(\||\|{2}|&&)\s+/;
