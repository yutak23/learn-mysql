import { program } from 'commander';
import mysql from 'mysql2/promise';
import config from 'config';
import cliProgress from 'cli-progress';
import stream from 'stream';

program.option('--is-stream').parse(process.argv);
const { isStream } = program.opts();

const bar = new cliProgress.SingleBar({
	format: `CLI Progress |{bar}| {percentage}% || {value}/{total} counts`,
	barCompleteChar: '\u2588',
	barIncompleteChar: '\u2591',
	hideCursor: true
});

console.log(process.pid);

const main = async () => {
	const hrstart = process.hrtime();
	const connection = await mysql.createConnection(config.get('mysql'));

	bar.start(3000000, 0);

	if (isStream) {
		const readerStream = connection.connection
			.query('SELECT * FROM `texts`;')
			.stream();

		const writerStrem = new stream.Writable({
			objectMode: true,
			write(data, encoding, callback) {
				// await connection.query(...) <- DB insert/update
				bar.increment();
				callback();
			}
		});

		stream.pipeline(readerStream, writerStrem, (err) => {
			if (err) console.error(err);

			bar.stop();

			const hrend = process.hrtime(hrstart);
			console.info(`Execution time : ${hrend} sec`);

			connection.destroy();
		});

		return;

		// 以下はwriterがないのであれば利用できそうな実装方法
		// await new Promise((accept, reject) => {
		// 	const s1 = connection.connection.query('SELECT * FROM `texts`;');
		// 	// eslint-disable-next-line no-unused-vars
		// 	s1.on('result', (row) => {
		// 		bar.increment();
		// 	});
		// 	s1.on('end', accept);
		// 	s1.on('error', reject);
		// });
	}

	try {
		await Promise.all(
			[...Array(3)].map(async (_, i) => {
				const [rows] = await connection.query(
					'SELECT * FROM `texts` LIMIT ? OFFSET ? ;',
					[1000000, i * 1000000]
				);

				await Promise.all(
					// eslint-disable-next-line no-unused-vars
					rows.map(async (row) => {
						// await connection.query(...) <- DB insert/update
						bar.increment();
					})
				);
			})
		);

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
