'use strict';
import BaseCommand from './baseCommand';
import ChangeLocCommand from './changeLocCommand';
import SetVarCommand from './setVarCommand';

var commandTypes = [
	ChangeLocCommand,
	SetVarCommand
];

commandTypes.push(BaseCommand); // always last

module.exports.fromString = function (commandString) {
	var base = commandString.split(/\s+/)[0];
	var commandType;

	commandTypes.forEach((type) => {
		type.COMMAND_NAMES.forEach((name) => {
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

module.exports.CHAIN_OPERATORS = BaseCommand.CHAIN_OPERATORS;
module.exports.CHAIN_OPERATOR_MATCH = BaseCommand.CHAIN_OPERATOR_MATCH;
