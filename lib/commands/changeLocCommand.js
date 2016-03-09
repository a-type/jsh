'use strict';
import BaseCommand from './baseCommand';
const Bluebird = require('bluebird');

export default class ChangeLocCommand extends BaseCommand {
	run () {
		const self = this;

		return new Bluebird((resolve) => {
			try {
				process.chdir(self._arguments[0]);
				resolve({ code: 0 });
			}
			catch (err) {
				self._printError(err);
				resolve({ code: 1 });
			}
		});
	}

	static get COMMAND_NAMES () {
		return [ /cd/i ];
	}
}
