'use strict';
import test from 'ava';
import SetVarCommand from '../../lib/commands/setVarCommand';

test('setting a variable', (t) => {
	const varName = 'foo';
	const varVal = 'bar';
	const input = `set ${varName}=${varVal}`;

	const command = new SetVarCommand(input);

	return command.run()
	.then((result) => {
		t.is(result.code, 0);
		t.is(process.env[varName], varVal);

		process.env[varName] = undefined;
	});
});
