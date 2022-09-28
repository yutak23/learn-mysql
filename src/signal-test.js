/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-promise-executor-return */
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
	format: format.simple(),
	transports: [new transports.File({ filename: 'signal_example.log' })]
});
const sleep = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

const main = async () => {
	for (let i = 0; i < 100; i += 1) {
		logger.info(i);
		await sleep(500);
	}
};
(async () => {
	await main();
})();

console.log(process.pid);

const exit = (signal, value) => {
	logger.info(`signal ${signal} received`);
	logger.info('now shut donw ... please wait');

	setTimeout(() => {
		logger.info(`process exit by ${signal}`);

		process.exit(value);
	}, 1000);
};

process.on('SIGHUP', () => {
	exit('SIGHUP', 1);
});

process.on('SIGINT', () => {
	exit('SIGINT', 2);
});

process.on('SIGTERM', () => {
	exit('SIGTERM', 15);
});
