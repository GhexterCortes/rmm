import chalk from 'chalk';

export default (error: Error|string) => {
    console.log(`An error occurred: ${chalk.red(!(error instanceof Error) ? error : error.message)}`);

    process.exit(1);
}