import chalk from 'chalk'
import { existsSync, readFileSync } from 'fs'

export default (): { [key: string]: any } => {
    if (!existsSync('package.json')) throw new Error(`No ${chalk.yellow('package.json')} found in ${chalk.yellow(process.cwd())}`);

    const packageJSON = readFileSync('./package.json', 'utf8');

    return JSON.parse(packageJSON);
}