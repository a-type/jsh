'use strict';
import BaseCommand from './baseCommand';
const Bluebird = require('bluebird');

export default class SetVarCommand extends BaseCommand {
	run () {
		this._arguments.forEach((arg) => {
			const tokens = arg.split('=');
			process.env[tokens[0]] = tokens[1];
		});

		return Bluebird.resolve(0);
	}

	static get COMMAND_NAMES () {
		return [ /set/i, /export/i ];
	}
}
