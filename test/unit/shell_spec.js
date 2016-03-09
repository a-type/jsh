'use strict';
import BaseCommand from '../../lib/commands/baseCommand';
import Shell from '../../lib/shell';
import TestStream from './helpers/testStream';
const streamSpec = require('stream-spec');
const sinon = require('sinon');

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

test('creates commands', (t) => {
	const shell = new Shell();

	const command = shell.createCommand('ls');

	t.true(command instanceof BaseCommand);
	t.true(command.base === 'ls');
});

test('runs commands', (t) => {
	const testStream = new TestStream();
	const shell = new Shell();
	testStream.pipe(shell);
	shell.pipe(testStream);

	const sandbox = sinon.sandbox.create();

	const input = [ 'l', 's', '\r' ];

	const mockCommand = sinon.createStubInstance(BaseCommand);
	mockCommand.run.returns(mockCommand);
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

test('running chained commands', (t) => {
	const testStream = new TestStream();
	const shell = new Shell();
	testStream.pipe(shell);
	shell.pipe(testStream);

	const sandbox = sinon.sandbox.create();

	const input = [ 'l', 's', ' ', '&', '&', ' ', 'l', 's', '\r' ];

	const mockCommand = sinon.createStubInstance(BaseCommand);
	mockCommand.run.returns(mockCommand);
	sandbox.stub(shell, 'createCommand').returns(mockCommand);

	input.forEach(testStream.send.bind(testStream));

	return TestStream.wait(testStream)
	.then(() => {
		t.is(shell.createCommand.callCount, 1);
		t.is(shell.createCommand.calledWith('ls && ls'), true);

		sandbox.restore();
	});
});

test('resets the buffer', (t) => {
	const shell = new Shell();
	shell.write('foo');
	shell._reset();

	t.is(shell._buffer, '');
});
