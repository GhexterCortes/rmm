import chalk from 'chalk';
import stringSimilarity from 'string-similarity-js';
import { CommandBuilder } from '../util/CommandBuilder';
import { createCommandUsage } from '../util/createCommandUsage';

export default new CommandBuilder()
    .setName('help')
    .setAliases(['h'])
    .setDescription('Prints the command list and usage')
    .addOption(command => command
        .setName('command')
        .setDescription('Prints the usage of the specified command')
        .setRequired(false)
        .setType('STRING')
    )
    .setExecute((options, command, commands) => {
        const footer = 'Use ' + chalk.yellow('rmm help <command>') + ' to see help for a specific command';
        const footerAllCommands = 'Use ' + chalk.yellow('rmm help') + ' to see a list of commands';

        if (!options[0].value) {
            console.log(`These are the available commands:`);
            console.log(commands.map(c => `    ${createCommandUsage(c)}`).join('\n'));
            console.log('');
            console.log(footer);
            return;
        }

        const commandName = options[0].value;
        const cmd = commands.find(c => c.name === commandName || c.aliases.includes(commandName));

        if (!cmd) {
            const filter = commands.filter(c => stringSimilarity(c.name, commandName) > 0.5 || c.aliases.some(a => stringSimilarity(a, commandName) > 0.5));

            console.log(`Command ${chalk.yellow(commandName)} not found`);
            console.log('');

            if (filter.length) {
                console.log('Did you mean one of these?');
                console.log(filter.map(c => `    ${createCommandUsage(c)}`).join('\n'));
                console.log('');
            }

            console.log(footerAllCommands);
            return;
        }

        console.log(`${chalk.blue(cmd.name)} — ${cmd.description}`);
        console.log('');
        console.log(`   ${cmd.description}`);
        console.log('');
        console.log(`   Usage: ${createCommandUsage(cmd)}`);
        console.log('');

        if (cmd.options.length) {
            console.log('   Options:');
            console.log(cmd.options.map(o => `      ${o.required ? chalk.magenta(o.name) : chalk.green(o.name)}${o.type !== 'STRING' ? chalk.gray(':' + o.type) : ''} — ${o.description}`).join('\n'));
            console.log('');

            console.log('');
        }

        console.log(footer);
    })