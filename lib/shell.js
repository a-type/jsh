"use strict";

var Commands = require("./commands");
var stream   = require("stream");
var util     = require("util");

var DEBUG = process.env.DEBUG === "true";
if (DEBUG) {
	console.log("Debug Mode");
}

var LINE_DELIMITER_REGEX = /\x0d|\x0a/;

function Shell () {
	Shell.super_.apply(this, arguments);
	this._buffer = "";
	this._rawBuffer = [];

	this.read(0);
}
util.inherits(Shell, stream.Transform);

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
		match = Commands.CHAIN_OPERATOR_MATCH.exec(line);
	}
	tokenized.push(line);

	return tokenized;
}

// Just filters out non-printed ASCII codes... I don't really
// know what I'm doing.
// Returns a string
function filterInput (inputBuffer) {
	var ascii = "";
	var inQuotes = false;
	var i = 0;
	for (i = 0; i < inputBuffer.length; i++) {
		var charCode = inputBuffer[i];
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

Shell.prototype._read = function () {
	// var self = this;

	// while (self._rawBuffer.length) {
	// 	var chunk = self._rawBuffer.shift();
	// 	if (!self.push(chunk)) {
	// 		break;
	// 	}
	// }
};

Shell.prototype._write = function (input, encoding, next) {
	if (DEBUG) {
		console.log("SHELL> " + input);
	}

	this.push(input);

	var asciiInput = filterInput(input);

	this._buffer += asciiInput;

	// search for line delimiters
	// if none, we're done
	if (this._buffer.search(LINE_DELIMITER_REGEX) >= 0) {
		var index = this._buffer.search(LINE_DELIMITER_REGEX);
		while (index >= 0) {
			var commandLine = this._buffer.substring(0, index);
			// push a newline out
			this.push(new Buffer("\n"));

			this.runLine(commandLine);
			this._buffer = this._buffer.substring(index + 1);
			index = this._buffer.search(LINE_DELIMITER_REGEX);
		}
	}

	next();
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

Shell.prototype._handleCommandData = function (data) {
	this.push(data);
};

Shell.prototype.Command = function (commandString) {
	if (DEBUG) {
		console.log("SHELL> RUN COMMAND> " + commandString);
	}
	var self = this;

	var CommandType = Commands.fromString(commandString);
	var command = new CommandType(commandString, self);
	command.on("data", self._handleCommandData);
	command.on("error", self._handleCommandData);
	return command;
};

Shell.prototype._reset = function () {
	this._buffer = "";
};

module.exports = Shell;
