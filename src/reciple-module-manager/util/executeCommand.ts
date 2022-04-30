import { boolean } from 'boolean';
import chalk from 'chalk';
import { isNumber } from 'fallout-utility';
import stringSimilarity from 'string-similarity-js';
import { CommandBuilder } from './CommandBuilder';
import { CommandOption } from './CommandOptionBuilder';
import { createCommandUsage } from './createCommandUsage';

export function executeCommand(commands: CommandBuilder[]) {
    const command = process.argv.slice(2)[0];
    const args = process.argv.slice(3).map(m => m === ':null:' ? null : m);

    if (!command) {
        console.log(`Usage: rmm <command> [options]`);
        console.log(`Use ${chalk.yellow('rmm help')} to see a list of commands`);
        process.exit(0);
    }

    const commandBuilder = commands.find(c => c.name === command || c.aliases.includes(command));
    if (!commandBuilder) {
        const filter = commands.filter(c => stringSimilarity(c.name, command) > 0.5 || c.aliases.some(a => stringSimilarity(a, command) > 0.5)).splice(0, 5);

        console.log(`Command ${chalk.red(command)} not found`);
        
        if (filter.length) {
            console.log(`Did you mean ${chalk.blue.bold(filter.map(c => c.name).join(', '))}?`);
        }

        console.log(`Use ${chalk.yellow('rmm help')} to see a list of commands`);
        process.exit(1);
    }

    if (args.length > commandBuilder.options.length) {
        console.log(`Too many arguments`);
        console.log(`Usage: ` + createCommandUsage(commandBuilder));
        process.exit(1);
    }

    let options: CommandOption[] = [];
    for (const option of commandBuilder.options) {
        let arg = args[options.length];
        if (!arg && option.required) {
            console.log(`Missing required argument ${chalk.red(option.name)}`);
            console.log(`Usage: ` + createCommandUsage(commandBuilder));
            process.exit(1);
        }

        const opt: CommandOption = {
            name: option.name,
            description: option.description,
            required: option.required,
            type: option.type,
            value: undefined
        }

        switch (option.type) {
            case 'STRING': opt.value = arg; break;
            case 'NUMBER':
                if (!isNumber(arg)) {
                    console.log(`Invalid number ${chalk.red(arg)}`);
                    console.log(`Usage: ` + createCommandUsage(commandBuilder));
                    process.exit(1);
                }

                opt.value = parseInt(arg ?? '0', 10);
                break;
            case 'BOOLEAN': opt.value = !!boolean(arg); break;
        } 

        options.push(opt);
    }

    commandBuilder.execute(options, commandBuilder, commands);
}