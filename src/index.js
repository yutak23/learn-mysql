import { program, InvalidArgumentError } from 'commander';
import mysql from 'mysql2/promise';
import config from 'config';
import cliProgress from 'cli-progress';

// eslint-disable-next-line no-unused-vars
const validateParseInt = (value, _) => {
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed)) throw new InvalidArgumentError('Not a Number');
	if (parsed < 0 || parsed > 1000)
		throw new InvalidArgumentError(
			'must be greater than 0 and less than or equal 1000'
		);

	return parsed;
};

program
	.requiredOption(
		'-bs, --block-size <size>',
		'size of the block to be processed',
		validateParseInt
	)
	.parse(process.argv);
const { blockSize } = program.opts();

const bar = new cliProgress.SingleBar({
	format: `CLI Progress |{bar}| {percentage}% || {value}/{total} counts`,
	barCompleteChar: '\u2588',
	barIncompleteChar: '\u2591',
	hideCursor: true
});

console.log(`process id is ${process.pid}`);

let receivedSignal;

const main = async () => {
	const hrstart = process.hrtime();
	const connection = await mysql.createConnection(config.get('mysql'));

	try {
		const [count] = await connection.query(
			'SELECT MAX(id) as max FROM `texts`;'
		);
		const maxId = count.shift().max;

		bar.start(Math.floor(maxId / blockSize), 0);

		for (let i = 0; i < maxId; i += blockSize) {
			const startId = i + 1;
			const currentId = i + blockSize;

			// eslint-disable-next-line no-await-in-loop
			const [rows] = await connection.query(
				'SELECT * FROM `texts` LIMIT ? OFFSET ? ;',
				[blockSize, startId]
			);

			// eslint-disable-next-line no-restricted-syntax, no-await-in-loop, no-unused-vars
			for await (const row of rows) {
				// await connection.query(...) <- DB insert/update
				bar.increment();
			}

			if (receivedSignal) {
				console.log(`Processed id is "${currentId}"`);
				break;
			}
		}

		bar.stop();

		const hrend = process.hrtime(hrstart);
		console.info(`Execution time : ${hrend} sec`);
	} catch (err) {
		console.error(err);
	} finally {
		connection.destroy();
	}
};

(async () => {
	await main();
})();

const exit = (signal) => {
	bar.stop();

	receivedSignal = signal;
	console.log(`signal ${signal} received`);
	console.log('now shut donw ... please wait');
};

process.on('SIGINT', () => {
	exit('SIGINT');
});
