'use strict';
import BaseCommand from '../../lib/commands/baseCommand';
import Shell from '../../lib/shell'
import TestStream from './helpers/testStream';
const streamSpec  = require('stream-spec');
const Sinon       = require('sinon');

const expect = require('chai').expect;

describe('the shell', () => {
	it('is a valid duplex stream', () => {
		streamSpec(new Shell())
		.duplex({ strict : true })
		.validateOnExit();
	});

	let shell;
	let testStream;

	before(() => {
		testStream = new TestStream();
		shell = new Shell();

		testStream.pipe(shell);
		shell.pipe(testStream);
	});

	describe('accepting input', () => {
		describe('when configured to echo input', () => {
			let input;

			before(() => {
				input = [ '\x09', 'a', 'b', 'c', '\x20' ];
				input.forEach(testStream.send.bind(testStream));
			});

			after(() => {
				testStream.clear();
				shell._reset();
			});

			it('echoes all input back', () => {
				input.forEach((data, idx) => {
					expect(testStream.output[idx], 'output at ' + idx).to.equal(data);
				});
			});
		});

		describe('when configured to not echo input', () => {
			let input;
			let testStream;
			let shell;

			before(() => {
				testStream = new TestStream();
				shell = new Shell({ echoInput : false });

				testStream.pipe(shell);
				shell.pipe(testStream);
				input = [ '\x09', 'a', 'b', 'c', '\x20' ];
				input.forEach(testStream.send.bind(testStream));
			});

			after(() => {
				testStream.clear();
				shell._reset();
			});

			it('does not echo input back', () => {
				expect(testStream.output.length, 'has output').to.equal(0);
			});
		});
	});

	describe('accepting command input', () => {
		let input;

		before(() => {
			Sinon.spy(shell, 'createCommand');
			Sinon.stub(BaseCommand.prototype, 'run');

			input = [ 'l', 's', '\r' ];
			input.forEach(testStream.send.bind(testStream));
		});

		after(() => {
			shell.createCommand.restore();
			BaseCommand.prototype.run.restore();
			testStream.clear();
			shell._reset();
		});

		it('runs the command', () => {
			expect(shell.createCommand.callCount, 'command create').to.equal(1);
			expect(shell.createCommand.calledWith('ls'), 'ls command create').to.be.true;
			expect(BaseCommand.prototype.run.callCount, 'run called').to.equal(1);
		});
	});

	describe('accepting command input with escaped characters', () => {
		let input;

		before(() => {
			Sinon.spy(shell, 'createCommand');
			Sinon.stub(BaseCommand.prototype, 'run');

			input = [ 'l', '\t', '\x01', 's', '\r' ];
			input.forEach(testStream.send.bind(testStream));
		});

		after(() => {
			shell.createCommand.restore();
			BaseCommand.prototype.run.restore();
			testStream.clear();
			shell._reset();
		});

		it('runs the command without escaped input', () => {
			expect(shell.createCommand.callCount, 'command create').to.equal(1);
			expect(shell.createCommand.calledWith('ls'), 'ls command create').to.be.true;
			expect(BaseCommand.prototype.run.callCount, 'run called').to.equal(1);
		});
	});
});
