'use strict';
const Bluebird = require('bluebird');
const EventEmitter = require('events').EventEmitter;
const childProcess = require('child_process');

const TOKEN_SEPARATOR = /\s+/;
const OPTION_PREFIX = '-';

export default class BaseCommand extends EventEmitter {
	constructor (commandString) {
		super(arguments);

		this._source = commandString.trim();
		const tokens = this._source.split(TOKEN_SEPARATOR);
		this._baseCommand = tokens.shift();

		this._output = '';
		this._childProcess = null;
		this._running = false;

		// sort remaining tokens into options or arguments
		this._options = [];
		this._arguments = [];

		tokens.forEach((token) => {
			if (token.indexOf(OPTION_PREFIX) === 0) {
				this._options.push(token);
			}
			else {
				this._arguments.push(token);
			}
		});
	}

	get options () {
		return this._options;
	}

	get arguments () {
		return this._arguments;
	}

	get base () {
		return this._baseCommand;
	}

	get sourceString () {
		return this._source;
	}

	get output () {
		return this._output;
	}

	get promise () {
		return this._runCompletionPromise;
	}

	get stdin () {
		if (this._childProcess) {
			return this._childProcess.stdin;
		}
		return null;
	}

	get stdout () {
		if (this._childProcess) {
			return this._childProcess.stdout;
		}
		return null;
	}

	get stderr () {
		if (this._childProcess) {
			return this._childProcess.stderr;
		}
		return null;
	}

	// returns a child process
	_startChildProcess () {
		if (this._running) {
			return this._childProcess;
		}

		this._running = true;
		this._childProcess = childProcess.spawn(this.sourceString, {
			cwd: process.cwd(),
			env: process.env,
			stdio: 'pipe',
			shell: true
		});

		return this._childProcess;
	}

	_printOutput (data) {
		this._output += data;
		this.emit('data', data);
	}

	_printError (data) {
		this._output += data;
		this.emit('err', data);
	}

	run () {
		if (this._runCompletionPromise) {
			return this._runCompletionPromise;
		}

		const child = this._startChildProcess();

		child.stdout.on('data', this._printOutput.bind(this));
		child.stderr.on('data', this._printError.bind(this));

		this._runCompletionPromise = new Bluebird((resolve) => {
			child.on('exit', resolve);
			child.on('close', resolve);
		});

		return this._runCompletionPromise;
	}

	then (continuation) {
		if (this._runCompletionPromise) {
			return this._runCompletionPromise.then(continuation);
		}
		else {
			return Bluebird.reject(new Error(`Command execution has not begun for command ${this.sourceString}`));
		}
	}

	static get COMMAND_NAMES () {
		return [ /.*/ ];
	}
}

