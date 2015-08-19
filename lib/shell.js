"use strict";

var Bluebird     = require("bluebird");
var childProcess = require("child_process");
var Commands     = require("./commands");
var path         = require("path");
var stream       = require("stream");
var util         = require("util");
var _            = require("lodash");

var DEBUG = process.env.DEBUG === "true";

var LINE_DELIMITER_REGEX = /\x0d|\x0a/;

function Shell () {
	Shell.super_.apply(this, arguments);
	var self = this;

	var buffer = "";
}
util.inherits(Shell, stream.Duplex);

function tokenizeCommandChain (input) {
	var line = input;
	var tokenized = [];
	var match = Commands.CHAIN_OPERATOR_MATCH.exec(line);
	while (match) {
		var chainOp = match[1];
		var commandString = line.slice(0, line.indexOf(chainOp)).trim();
		tokenized.push(commandString);
		tokenized.push(chainOp);
		line = line.slice(line.indexOf(chainOp) + chainOp.length).trim();
		match = Command.CHAIN_OPERATOR_MATCH.exec(line);
	}
	tokenized.push(line);

	return tokenized;
}

// Just filters out non-printed ASCII codes... I don't really
// know what I'm doing.
function filterInput (input) {
	var ascii = "";
	var inQuotes = false;
	var i = 0;
	for (i = 0; i < input.length; i++) {
		var charCode = input.charCodeAt(i);
		if (inQuotes || // quoted text is copied verbatim
			(charCode === 10 || charCode === 13) || // line feed / carriage return
			(charCode > 32 && charCode < 127) ||
			(charCode > 127) // maybe leave some room for unicode here
		) {
			ascii += input[i];

			// double and single quote
			if (charCode === 34 || charCode === 39) {
				inQuotes = !inQuotes;
			}
		}
	}
	return ascii;
};

Shell.prototype._handleData = function (data) {
	emitData(data);
}

Shell.prototype._handleError = function (errorData) {
	emitData(data);
}

Shell.prototype._emitData = function (data) {
	console.log("SHELL: " + data);
	this.push(data);
}

Shell.prototype._read = function (size) { }; // do I need this?

Shell.prototype._write = function (input, encoding, callback) {
	this._emitData(input);

	var asciiInput = filterInput(input);

	this._buffer += asciiInput;

	// search for line delimiters
	// if none, we're done
	if (this._buffer.search(LINE_DELIMITER_REGEX) < 0) {
		return;
	}
	else {
		var index = this._buffer.search(LINE_DELIMITER_REGEX);
		while (index >= 0) {
			var commandLine = this._buffer.substring(0, index);
			// emit a line feed
			this._emitData("\r\n");
			this.runLine(commandLine);
			this._buffer = this._buffer.substring(index + 1);
			index = this._buffer.search(LINE_DELIMITER_REGEX);
		}
	}
};

Shell.prototype.runLine = function (input) {
	var tokenized = tokenizeCommandChain(input);
	var command = this.Command(tokenized.shift());

	// build promise chain with any remaining tokens
	if (tokenized.length) {
		var lastCommand = command;

		while (tokenized.length) {
			var op = tokenized.shift();
			var nextCommand = this.Command(tokenized.shift());
			lastCommand = lastCommand.chain(op, nextCommand);
		}

		// evaluates to run completion promise of last command
		return lastCommand.run();
	}
	else {
		return command.run();
	}
};

Shell.prototype.Command = function (commandString) {
	var CommandType = Commands.fromString(commandString);
	var command = new CommandType(commandString, this);
	command.on("data", this._handleData);
	command.on("error", this._handleError);
	return command;
};

module.exports = Shell;
