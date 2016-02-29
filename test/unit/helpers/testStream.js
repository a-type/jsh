'use strict';
const Duplex = require('stream').Duplex;

export default class TestStream extends Duplex {
	constructor () {
		super(arguments);

		this.output = [];
		this.input = [];
	}

	send (data) {
		if (!this.push(data)) {
			this.input.push(new Buffer(data, 'utf-8'));
		}
	}

	_read () {
		while (this.input.length) {
			var chunk = this.input.shift();
			if (!this.push(chunk)) {
				break;
			}
		}
	}

	_write (data, encoding, next) {
		this.output.push(data.toString());

		next();
	}

	clear () {
		this.output = [];
	}
}
