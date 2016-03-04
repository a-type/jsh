'use strict';
const Duplex = require('stream').Duplex;
const Bluebird = require('bluebird');

export default class TestStream extends Duplex {
	constructor () {
		super(arguments);

		this.output = [];
		this.input = [];
	}

	// manually inserts data into the input for testing purposes
	send (data) {
		if (!this.push(data)) {
			this.input.push(new Buffer(data, 'utf-8'));
		}
	}

	// shell will read input
	_read () {
		while (this.input.length) {
			const chunk = this.input.shift();
			if (!this.push(chunk)) {
				break;
			}
		}
	}

	// shell will write to output
	_write (data, encoding, next) {
		this.output.push(data.toString());
		next();
	}

	// resets test stream state
	clear () {
		this.output = [];
		this.input = [];
	}

	static wait (stream) {
		return new Bluebird((resolve) => {
			stream.on('data', resolve);
		});
	}
}
