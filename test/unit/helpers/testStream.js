"use strict";
var Duplex   = require("stream").Duplex;
var util     = require("util");

function TestStream () {
	var self = this;
	Duplex.call(self);

	self.output = [];
	self.input = [];

	self.send = function (data) {
		if (!self.push(data)) {
			self.input.push(new Buffer(data, "utf-8"));
		}
	};

	self._read = function () {
		while (self.input.length) {
			var chunk = self.input.shift();
			if (!self.push(chunk)) {
				break;
			}
		}
	};

	self._write = function (data, encoding, next) {
		self.output.push(data.toString());

		next();
	};

	self.clear = function () {
		self.output = [];
	};
}
util.inherits(TestStream, Duplex);

module.exports = TestStream;
