'use strict';
const Bluebird     = require('bluebird');
const EventEmitter = require('events').EventEmitter;
const childProcess = require('child_process');

const TOKEN_SEPARATOR = /\s+/;
const OPTION_PREFIX = '-';
const PIPE = '|';
const OR = '||';
const AND = '&&';

export default class BaseCommand extends EventEmitter {
	constructor (commandString, shell) {
		super(arguments);

		this._source = commandString.trim();
		var tokens = this._source.split(TOKEN_SEPARATOR);
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

	// returns a child process
	_startChildProcess () {
		if (this._running) {
			return this._childProcess;
		}

		this._running = true;
		this._childProcess = childProcess.spawn(this.sourceString, {
			cwd   : process.cwd(),
			env   : process.env,
			stdio : 'pipe'
		});

		return this._childProcess;
	}

	_printOutput (data) {
		this._output += data;
		this.emit('data', data);
	}

	_printError (data) {
		this._output += data;
		self.emit('error', data);
	}

	run () {
		if (this._runCompletionPromise) {
			return this._runCompletionPromise;
		}

		var child = this._startChildProcess();

		child.stdout.on('data', this._printOutput);
		child.stderr.on('data', this._printError);

		this._runCompletionPromise = new Bluebird((resolve) => {
			child.on('exit', resolve);
			child.on('close', resolve);
		});

		return this._runCompletionPromise;
	}

	// returns a promise for the completion of both commands in parallel
	pipe (nextCommand) {
		var completion = Bluebird.all([ this.run(), nextCommand.run() ]);
		var child = this._childProcess;
		var theirChild = nextCommand._childProcess;
		child.stdout.pipe(theirChild.stdin);

		return completion;
	}

	// returns a promise for the completion of the last successful command
	and (nextCommand) {
		return this.run()
		.then((result) => {
			if (result.code === 0) {
				return nextCommand.run();
			}
			else {
				return result;
			}
		});
	}

	// returns a promise
	or (nextCommand) {
		return this.run()
		.then((result) => {
			if (result.code !== 0) {
				return nextCommand.run();
			}
			else {
				return result;
			}
		});
	}

	chain (nextCommand) {
		switch (chainOperator) {
			case PIPE:
				return this.pipe(nextCommand);
			case OR:
				return this.or(nextCommand);
			case AND:
				return this.and(nextCommand);
			default:
				return Bluebird.reject(new Error('invalid chain operator'));
		}
	}

	static get COMMAND_NAMES () {
		return [ /.*/ ];
	}

	static get CHAIN_OPERATORS () {
		return [ PIPE, OR, AND ];
	}

	static get CHAIN_OPERATOR_MATCH () {
		return /\s+(\||\|{2}|&{2})\s+/;
	}
}

