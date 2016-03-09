'use strict';
import test from 'ava';
import ChangeLocCommand from '../../lib/commands/changeLocCommand';

const sinon = require('sinon');

test.serial('changing location', (t) => {
	const location = './loc';
	const input = `cd ${location}`;
	const command = new ChangeLocCommand(input);

	const sandbox = sinon.sandbox.create();
	sandbox.stub(process, 'chdir');

	return command.run()
	.then((result) => {
		t.is(result.code, 0);
		t.true(process.chdir.calledWith(location));

		sandbox.restore();
	});
});

test.serial('failing to change location', (t) => {
	const location = '../foo';
	const input = `cd ${location}`;
	const command = new ChangeLocCommand(input);

	const sandbox = sinon.sandbox.create();
	sandbox.stub(process, 'chdir').throws(new Error('Simulated Failure'));

	return command.run()
	.then((result) => {
		t.is(result.code, 1);
		t.true(process.chdir.calledWith(location));

		sandbox.restore();
	});
});
