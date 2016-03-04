'use strict';

const Commands = require('./commands');
const stream = require('stream');
const _ = require('lodash');

const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) {
	console.log('Debug Mode');
}

const LINE_DELIMITER_REGEX = /\x0d|\x0a/;

const DEFAULT_OPTIONS = {
	echoInput: true
};

function tokenizeCommandChain (input) {
	let line = input;
	const tokenized = [];
	let match = Commands.CHAIN_OPERATOR_MATCH.exec(line);
	while (match) {
		const chainOp = match[1];
		const commandString = line.slice(0, line.indexOf(chainOp)).trim();
		tokenized.push(commandString);
		tokenized.push(chainOp);
		line = line.slice(line.indexOf(chainOp) + chainOp.length).trim();
		match = Commands.CHAIN_OPERATOR_MATCH.exec(line);
	}
	tokenized.push(line);

	return tokenized;
}

// Just filters out non-printed ASCII codes... I don't really
// know what I'm doing.
// Returns a string
function filterInput (inputBuffer) {
	let ascii = '';
	let inQuotes = false;
	let i = 0;
	for (i = 0; i < inputBuffer.length; i++) {
		const charCode = inputBuffer[i];
		if (inQuotes || // quoted text is copied verbatim
			(charCode === 10 || charCode === 13) || // line feed / carriage return
			(charCode > 32 && charCode < 127) ||
			(charCode > 127) // maybe leave some room for unicode here
		) {
			ascii += String.fromCharCode(inputBuffer[i]);

			// double and single quote
			if (charCode === 34 || charCode === 39) {
				inQuotes = !inQuotes;
			}
		}
	}
	return ascii;
}

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
		if (DEBUG) {
			console.log(`SHELL> ${input}`);
		}

		if (this.echoInput) {
			this.push(input);
		}

		const asciiInput = filterInput(input);

		this._buffer += asciiInput;

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

	runLine (input) {
		const tokenized = tokenizeCommandChain(input);
		const command = this.createCommand(tokenized.shift());

		// build promise chain with any remaining tokens
		if (tokenized.length) {
			let lastCommand = command;

			while (tokenized.length) {
				const op = tokenized.shift();
				const nextCommand = this.createCommand(tokenized.shift());
				lastCommand = lastCommand.chain(op, nextCommand);
			}

			// evaluates to run completion promise of last command
			return lastCommand.run();
		}
		else {
			return command.run();
		}
	}

	createCommand (commandString) {
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
