import chalk from 'chalk';
import { CommandOptionBuilder, CommandOption } from './CommandOptionBuilder';

export class CommandBuilder {
    public name: string = '';
    public aliases: string[] = [];
    public description: string = 'No description';
    public options: CommandOptionBuilder[] = [];
    public execute: (options: CommandOption[], command: CommandBuilder, commands: CommandBuilder[]) => any|Promise<any> = () => {};

    public setName(name: string): CommandBuilder {
        if (!/^[\w-]{1,32}$/.test(name)) throw new Error(`Invalid command name ${chalk.red(name)}`);
        this.name = name;
        return this;
    }

    public setAliases(aliases: string[]): CommandBuilder {
        for (const alias of aliases) {
            if (!/^[\w-]{1,32}$/.test(alias)) throw new Error(`Invalid command alias ${chalk.red(alias)}`);
        }

        this.aliases = aliases;
        return this;
    }

    public setDescription(description: string): CommandBuilder {
        this.description = description ?? 'No description';
        return this;
    }

    public addOption(option: CommandOptionBuilder|((builder: CommandOptionBuilder) => CommandOptionBuilder)): CommandBuilder {
        if (typeof option === 'function') {
            option = option(new CommandOptionBuilder());
        }

        if (this.options.find(opt => opt.name === option.name)) throw new Error(`Option ${chalk.red(option.name)} already exists`);
        if (option.required && !(this.options[this.options.length - 1]?.required ?? true)) throw new Error(`All optional options must be at the end`);

        this.options.push(option);
        return this;
    }

    public setExecute(execute: (options: CommandOption[], command: CommandBuilder, commands: CommandBuilder[]) => any|Promise<any>): CommandBuilder {
        this.execute = execute;
        return this;
    }
}