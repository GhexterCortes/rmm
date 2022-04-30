import chalk from 'chalk';
import { existsSync } from 'fs';
import yml from 'yaml';

export function getRecipleYml(): { [key: string]: any } {
    if (!existsSync('reciple.yml')) {
        console.log('No reciple.yml found');
        console.log(`Run ${chalk.yellow('reciple')} to create a reciple.yml`);
        process.exit(1);
    }

    return yml.parse(require('fs').readFileSync('reciple.yml', 'utf8'));
}

export function isRecipleYmlExists(): boolean {
    return existsSync('reciple.yml');
}