"use strict";
var Bluebird     = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var childProcess = require("child_process");
var utils        = require("util");
var _            = require("lodash");

function BaseCommand (commandString, shell) {
	EventEmitter.call(this);
	var self = this;

	var source = _.trim(commandString);
	var tokens = commandString.split(/\s+/);
	var baseCommand = tokens.shift();

	this._shell = shell;

	this._output = "";

	var running = false;
	var child;

	// sort remaining tokens into options or arguments
	var opts = [];
	var args = [];
	_.each(tokens, function (token) {
		if (token.indexOf("-") === 0) {
			opts.push(token);
		}
		else {
			args.push(token);
		}
	});

	Object.defineProperty(this, "options", {
		get : function () {
			return opts;
		},

		enumerable : true
	});

	Object.defineProperty(this, "arguments", {
		get : function () {
			return args;
		},

		enumerable : true
	});

	Object.defineProperty(this, "base", {
		get : function () {
			return baseCommand;
		},

		enumerable : true
	});

	Object.defineProperty(this, "sourceString", {
		get : function () {
			return source;
		},

		enumerable : true
	});

	Object.defineProperty(this, "output", {
		get : function () { return this._output; }
	});

	this._childProcess = function () {
		if (running) {
			return child;
		}

		running = true;
		child = childProcess.spawn(self.sourceString, {
			cwd   : process.cwd(),
			env   : process.env,
			stdio : "pipe"
		});

		return child;
	};

	this._output = function (data) {
		self._output += data;
		self.emit("data", data);
	};

	this._error = function (err) {
		self._output += err;
		self.emit("error", err);
	};

	var runCompletionPromise;

	this._runCommand = function () {
		if (runCompletionPromise) {
			return runCompletionPromise;
		}

		var child = self._childProcess();

		child.stdout.on("data", self._output);
		child.stderr.on("data", self._error);

		runCompletionPromise = new Bluebird(function (resolve) {
			child.on("exit", resolve);
			child.on("close", resolve);
		});

		return runCompletionPromise;
	};
}
utils.inherits(BaseCommand, EventEmitter);

BaseCommand.prototype.run = function () {
	return this._runCommand();
};

BaseCommand.prototype.pipe = function (nextCommand) {
	var myChild = this._childProcess();
	var theirChild = nextCommand._childProcess();
	myChild.stdout.pipe(theirChild.stdin);

	return nextCommand; // for chaining
};

BaseCommand.prototype.and = function (nextCommand) {
	return this.run()
	.then(function (result) {
		if (result.code === 0) {
			return nextCommand.run();
		}
		else {
			return result;
		}
	});
};

BaseCommand.prototype.or = function (nextCommand) {
	return this.run()
	.then(function (result) {
		if (result.code !== 0) {
			return nextCommand.run();
		}
		else {
			return result;
		}
	});
};

BaseCommand.prototype.chain = function (chainOperator, nextCommand) {
	switch (chainOperator) {
		case "|":
			return this.pipe(nextCommand);
		case "||":
			return this.or(nextCommand);
		case "&&":
			return this.and(nextCommand);
		default:
			return Bluebird.reject(new Error("Invalid Chain Operator"));
	}
};

BaseCommand.COMMAND_NAMES = [ /.*/ ];

module.exports = BaseCommand;
