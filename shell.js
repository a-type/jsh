"use strict";

var Bluebird     = require("bluebird");
var childProcess = require("child_process");
var Commands     = require("./commands");
var EventEmitter = require("events").EventEmitter;
var path         = require("path");
var util         = require("util");
var _            = require("lodash");

var DEBUG = process.env.DEBUG === "true";

var LINE_DELIMITER_REGEX = /\x0d|\x0a/;

// string starts with non-space characters, ends with >
// TODO: user-configurable
var PROMPT_MATCH = /^(\S+)>$/;

function Shell () {
	var self = this;

	var buffer = "";

	function handleData (data) {
		emitData(data);
	}

	function handleError (errorData) {
		emitData(data);
	}

	function emitData (data) {
		console.log("SHELL: " + data);
		self.emit("data", data);
	}

	this.tokenizeCommandChain = function (input) {
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
	this.filterInput = function (input) {
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

	this.write = function (input) {
		emitData(input);

		var asciiInput = self.filterInput(input);

		buffer += asciiInput;

		// search for line delimiters
		// if none, we're done
		if (buffer.search(LINE_DELIMITER_REGEX) < 0) {
			return;
		}
		else {
			var index = buffer.search(LINE_DELIMITER_REGEX);
			while (index >= 0) {
				var commandLine = buffer.substring(0, index);
				// emit a line feed
				emitData("\r\n");
				self.runLine(commandLine);
				buffer = buffer.substring(index + 1);
				index = buffer.search(LINE_DELIMITER_REGEX);
			}
		}
	};

	this.runLine = function (input) {
		var tokenized = this.tokenizeCommandChain(input);
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

	this.Command = function (commandString) {
		var CommandType = Commands.fromString(commandString);
		var command = new CommandType(commandString, this);
		command.on("data", handleData);
		command.on("error", handleError);
		return command;
	};
}

util.inherits(Shell, EventEmitter);

module.exports = Shell;
