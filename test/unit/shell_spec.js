'use strict';
import BaseCommand from '../../lib/commands/baseCommand';
import Shell from '../../lib/shell';
import TestStream from './helpers/testStream';
const streamSpec = require('stream-spec');
const Sinon = require('sinon');

import test from 'ava';

test('the shell is a duplex stream', () => {
	streamSpec(new Shell())
	.duplex({ strict: true })
	.validateOnExit();
});

test('echoes input when told', (t) => {
	const testStream = new TestStream();
	const shell = new Shell();
	testStream.pipe(shell);
	shell.pipe(testStream);

	const input = [ '\x09', 'a', 'b', 'c', '\x20' ];
	input.forEach(testStream.send.bind(testStream));

	return TestStream.wait(testStream)
	.then(() => {
		input.forEach((data, idx) => {
			t.is(testStream.output[idx], data);
		});
	});
});

test('does not echo input when not told', (t) => {
	const testStream = new TestStream();
	const shell = new Shell({ echoInput: false });
	testStream.pipe(shell);
	shell.pipe(testStream);

	const input = [ '\x09', 'a', 'b', 'c', '\x20' ];
	input.forEach(testStream.send.bind(testStream));

	return TestStream.wait(testStream)
	.then(() => {
		t.is(testStream.output.length, 0);
	});
});

test('runs commands', (t) => {
	const testStream = new TestStream();
	const shell = new Shell();
	testStream.pipe(shell);
	shell.pipe(testStream);

	const sandbox = Sinon.sandbox.create();

	const input = [ 'l', 's', '\r' ];

	const mockCommand = Sinon.createStubInstance(BaseCommand);
	sandbox.stub(shell, 'createCommand').returns(mockCommand);

	input.forEach(testStream.send.bind(testStream));

	return TestStream.wait(testStream)
	.then(() => {
		t.is(shell.createCommand.callCount, 1);
		t.is(shell.createCommand.calledWith('ls'), true);
		t.is(mockCommand.run.callCount, 1);

		sandbox.restore();
	});
});

test('accepting command input with escaped characters', (t) => {
	const testStream = new TestStream();
	const shell = new Shell();
	testStream.pipe(shell);
	shell.pipe(testStream);

	const sandbox = Sinon.sandbox.create();

	const input = [ 'l', '\t', '\x01', 's', '\r' ];

	sandbox.spy(shell, 'createCommand');
	sandbox.stub(BaseCommand.prototype, 'run');

	input.forEach(testStream.send.bind(testStream));

	return TestStream.wait(testStream)
	.then(() => {
		t.is(shell.createCommand.callCount, 1);
		t.is(shell.createCommand.calledWith('ls'), true);
		t.is(BaseCommand.prototype.run.callCount, 1);

		sandbox.restore();
	});
});
