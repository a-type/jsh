'use strict';

const Commands = require('./commands');
const stream = require('stream');
const _ = require('lodash');

const DEBUG = process.env.DEBUG === 'true';
/* istanbul ignore next */
if (DEBUG) {
	console.log('Debug Mode');
}

const LINE_DELIMITER_REGEX = /\x0d|\x0a/;

const DEFAULT_OPTIONS = {
	echoInput: true
};

export default class Shell extends stream.Transform {
	constructor (options) {
		super(arguments);

		this._buffer = '';

		options = options || {};
		_.assign(this, _.defaults(options, DEFAULT_OPTIONS)); // place all options on instance

		this.read(0);
	}

	_read () {

	}

	_write (input, encoding, next) {
		/* istanbul ignore next */
		if (DEBUG) {
			console.log(`SHELL> ${input}`);
		}

		if (this.echoInput) {
			this.push(input);
		}

		this._buffer += input;

		// search for line delimiters
		// if none, we're done
		if (this._buffer.search(LINE_DELIMITER_REGEX) >= 0) {
			let index = this._buffer.search(LINE_DELIMITER_REGEX);
			while (index >= 0) {
				const commandLine = this._buffer.substring(0, index);
				// push a newline out
				this.push(new Buffer('\n'));

				this.runLine(commandLine);
				this._buffer = this._buffer.substring(index + 1);
				index = this._buffer.search(LINE_DELIMITER_REGEX);
			}
		}

		next();
	}

	runLine (line) {
		const command = this.createCommand(line);
		this.pipe(command.stdin);
		command.stdout.pipe(this);
		command.stderr.pipe(this);
		return command.run().promise;
	}

	createCommand (commandString) {
		/* istanbul ignore next */
		if (DEBUG) {
			console.log(`SHELL> RUN COMMAND> ${commandString}`);
		}

		const CommandType = Commands.fromString(commandString);
		const command = new CommandType(commandString);
		command.on('data', this.push.bind(this));
		command.on('error', this.push.bind(this));
		return command;
	}

	_reset () {
		this._buffer = '';
	}
}
