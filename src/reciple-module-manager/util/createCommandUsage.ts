import chalk from 'chalk';
import { CommandBuilder } from './CommandBuilder';

export function createCommandUsage(command: CommandBuilder) {
    const options = command.options.map(option => {
        const brackets = [
            option.required ? chalk.magenta('<') : chalk.green('['),
            option.required ? chalk.magenta('>') : chalk.green(']'),
        ];

        const name = option.required ? option.name : chalk.italic(option.name);
        
        return `${brackets[0]}${name}${ option.type !== 'STRING' ? ':' + chalk.gray(option.name) : '' }${brackets[1]}`;
    });

    return `${command.name}${options.length ? ' ' + options.join(' ') : ''}`;
}