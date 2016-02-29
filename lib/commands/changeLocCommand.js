'use strict';
import BaseCommand from './baseCommand';
const Bluebird = require('bluebird');

export default class ChangeLocCommand extends BaseCommand {
	run () {
		var self = this;

		return new Bluebird((resolve) => {
			try {
				process.chdir(self._arguments[0]);
				resolve(0);
			}
			catch (err) {
				self._printError(err);
				resolve(1);
			}
		});
	}

	static get COMMAND_NAMES () {
		return [ /cd/i ];
	}
}
