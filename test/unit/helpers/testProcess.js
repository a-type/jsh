'use strict';

const EventEmitter = require('events').EventEmitter;

class TestStdIO extends EventEmitter {
	constructor () {
		super(arguments);
	}

	pipe (stream) {
		this.pipedTo = stream;
	}
}

export default class TestProcess extends EventEmitter {
	constructor (output, errorOutput) {
		super(arguments);
		this._output = output || '';
		this._errOutput = errorOutput || '';
		this.stdout = new TestStdIO();
		this.stderr = new TestStdIO();
		this.stdin = new TestStdIO();
	}

	run () {
		this.stdout.emit('data', this._output);
		this.stderr.emit('data', this._errOutput);
		this.emit('close');
	}
}
