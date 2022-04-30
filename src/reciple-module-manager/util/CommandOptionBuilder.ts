import chalk from 'chalk';

export type commandOptionType = 'STRING' | 'NUMBER' | 'BOOLEAN';

export interface CommandOption {
    name: string;
    description: string;
    type: commandOptionType;
    required: boolean;
    value: any;
}

export class CommandOptionBuilder {
    public name: string = '';
    public description: string = 'No description';
    public type: commandOptionType = 'STRING';
    public required: boolean = false;

    public setName(name: string): CommandOptionBuilder {
        if (!/^[\w-]{1,32}$/.test(name)) throw new Error(`Invalid command name ${chalk.red(name)}`);
        this.name = name;
        return this;
    }

    public setDescription(description: string): CommandOptionBuilder {
        this.description = description ?? 'No description';
        return this;
    }

    public setType(type: commandOptionType): CommandOptionBuilder {
        this.type = type;
        return this;
    }

    public setRequired(required: boolean): CommandOptionBuilder {
        this.required = !!required;
        return this;
    }
}