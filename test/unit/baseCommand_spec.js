'use strict';
import test from 'ava';
import BaseCommand from '../../lib/commands/baseCommand';
import TestProcess from './helpers/testProcess';

const sinon = require('sinon');
const childProcess = require('child_process');

test('basic command parsing', (t) => {
	const command = new BaseCommand('ls');
	t.is(command.base, 'ls');
	t.same(command.arguments, []);
	t.same(command.options, []);
	t.is(command.sourceString, 'ls');
});

test('command parsing with args', (t) => {
	const input = 'cd ./loc';
	const command = new BaseCommand(input);
	t.is(command.base, 'cd');
	t.same(command.arguments, [ './loc' ]);
	t.same(command.options, []);
	t.is(command.sourceString, input);
});

test('command parsing with opts', (t) => {
	const input = 'npm -v';
	const command = new BaseCommand(input);
	t.is(command.base, 'npm');
	t.same(command.arguments, []);
	t.same(command.options, [ '-v' ]);
	t.is(command.sourceString, input);
});

test('command parsing with args and opts', (t) => {
	const input = 'ls -al /';
	const command = new BaseCommand(input);
	t.is(command.base, 'ls');
	t.same(command.arguments, [ '/' ]);
	t.same(command.options, [ '-al' ]);
	t.is(command.sourceString, input);
});

test.serial('running a command', (t) => {
	const input = 'ls -al /';
	const commandStdOut = 'foo';
	const commandStdErr = 'bar';

	let output = '';
	let errorOutput = '';

	const sandbox = sinon.sandbox.create();
	const testProc = new TestProcess(commandStdOut, commandStdErr);
	sandbox.stub(childProcess, 'spawn').returns(testProc);

	const command = new BaseCommand(input);
	command.on('data', (out) => {
		output += out;
	});
	command.on('err', (out) => {
		errorOutput += out;
	});

	const runResult = command.run();

	t.ok(command.promise);

	runResult
	.then(() => {
		t.is(output, commandStdOut);
		t.is(errorOutput, commandStdErr);

		t.true(childProcess.spawn.calledWith(
			input,
			{
				cwd: sinon.match.string,
				env: sinon.match.object,
				stdio: 'pipe',
				shell: true
			}
		));

		sandbox.restore();
	});

	// kick off the process output and exit
	testProc.run();

	return runResult;
});

test.serial('running a command twice doesn\'t actually run ', (t) => {
	const input = 'ls';

	const sandbox = sinon.sandbox.create();
	const testProc = new TestProcess();
	sandbox.stub(childProcess, 'spawn').returns(testProc);

	const command = new BaseCommand(input);

	command.run();

	// run a second time
	const completion = command.run()
	.then(() => {
		t.is(childProcess.spawn.callCount, 1);

		sandbox.restore();
	});

	testProc.run();

	return completion;
});

test.serial('continuing using then', (t) => {
	t.plan(1);

	const input = 'ls';

	const sandbox = sinon.sandbox.create();
	const testProc = new TestProcess();
	sandbox.stub(childProcess, 'spawn').returns(testProc);

	const command = new BaseCommand(input);

	command.run();

	const completion = command.then(() => {
		t.pass();

		sandbox.restore();
	});

	testProc.run();

	return completion;
});

test.serial('continuing using then without running', (t) => {
	const input = 'ls';

	const sandbox = sinon.sandbox.create();
	const testProc = new TestProcess();
	sandbox.stub(childProcess, 'spawn').returns(testProc);

	const command = new BaseCommand(input);

	const completion = command.then(() => {
		t.fail();
	})
	.catch((err) => {
		t.regex(err, /execution has not begun/i);
		sandbox.restore();
	});

	testProc.run();

	return completion;
});

test.serial('trying to start a second child process', (t) => {
	const input = 'ls';

	const sandbox = sinon.sandbox.create();
	const testProc = new TestProcess();
	sandbox.stub(childProcess, 'spawn').returns(testProc);

	const command = new BaseCommand(input);

	command.run();

	command._startChildProcess();

	t.is(childProcess.spawn.callCount, 1);
});
