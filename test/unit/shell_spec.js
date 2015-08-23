"use strict";
var BaseCommand = require("../../lib/commands/baseCommand");
var Shell       = require("../../lib/shell");
var streamSpec  = require("stream-spec");
var Sinon       = require("sinon");
var TestStream  = require("./helpers/testStream");

var expect = require("chai").expect;

describe("the shell", function () {
	it("is a valid duplex stream", function () {
		streamSpec(new Shell())
		.duplex({ strict : true })
		.validateOnExit();
	});

	var shell;
	var testStream;

	before(function () {
		testStream = new TestStream();
		shell = new Shell();

		testStream.pipe(shell);
		shell.pipe(testStream);
	});

	describe("accepting input", function () {
		describe("when configured to echo input", function () {
			var input;

			before(function () {
				input = [ "\x09", "a", "b", "c", "\x20" ];
				input.forEach(function (data) {
					testStream.send(data);
				});
			});

			after(function () {
				testStream.clear();
				shell._reset();
			});

			it("echoes all input back", function () {
				input.forEach(function (data, idx) {
					expect(testStream.output[idx], "output at " + idx).to.equal(data);
				});
			});
		});

		describe("when configured to not echo input", function () {
			var input;
			var testStream;
			var shell;

			before(function () {
				testStream = new TestStream();
				shell = new Shell({ echoInput : false });

				testStream.pipe(shell);
				shell.pipe(testStream);
				input = [ "\x09", "a", "b", "c", "\x20" ];
				input.forEach(function (data) {
					testStream.send(data);
				});
			});

			after(function () {
				testStream.clear();
				shell._reset();
			});

			it("does not echo input back", function () {
				expect(testStream.output.length, "has output").to.equal(0);
			});
		});
	});

	describe("accepting command input", function () {
		var input;

		before(function () {
			Sinon.spy(shell, "Command");
			Sinon.stub(BaseCommand.prototype, "run");

			input = [ "l", "s", "\r" ];
			input.forEach(function (data) {
				testStream.send(data);
			});
		});

		after(function () {
			shell.Command.restore();
			BaseCommand.prototype.run.restore();
			testStream.clear();
			shell._reset();
		});

		it("runs the command", function () {
			expect(shell.Command.callCount, "command create").to.equal(1);
			expect(shell.Command.calledWith("ls"), "ls command create").to.be.true;
			expect(BaseCommand.prototype.run.callCount, "run called").to.equal(1);
		});
	});

	describe("accepting command input with escaped characters", function () {
		var input;

		before(function () {
			Sinon.spy(shell, "Command");
			Sinon.stub(BaseCommand.prototype, "run");

			input = [ "l", "\t", "\x01", "s", "\r" ];
			input.forEach(function (data) {
				testStream.send(data);
			});
		});

		after(function () {
			shell.Command.restore();
			BaseCommand.prototype.run.restore();
			testStream.clear();
			shell._reset();
		});

		it("runs the command without escaped input", function () {
			expect(shell.Command.callCount, "command create").to.equal(1);
			expect(shell.Command.calledWith("ls"), "ls command create").to.be.true;
			expect(BaseCommand.prototype.run.callCount, "run called").to.equal(1);
		});
	});
});
