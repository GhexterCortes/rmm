import { boolean } from 'boolean';
import { input } from 'fallout-utility';
import { existsSync, writeFileSync } from 'fs';
import { CommandBuilder } from '../util/CommandBuilder';
import compareVersions from '../util/compareVersions';
import { Module } from '../util/ModulesYML';
import supportedVersion from '../util/supportedVersion';

export default new CommandBuilder()
    .setName('init-module')
    .setAliases(['im'])
    .setDescription('Initializes a module\'s .reciple')
    .setExecute(() => {
        if (existsSync('.reciple')) return;

        const ask = (question: string, defaultValue?: string): string => {
            return input(`${question.trim()} ${defaultValue ? '(default: '+ defaultValue +')' : ''} `).toString() || (defaultValue ?? '');
        }

        const dotReciple: Module = {
            name: ask('Module name: ', 'my-module'),
            description: ask('Module description: '),
            authors: (() => ask('Author [separate by comma]: ').split(',').map(a => a.trim()))(),
            supportedVersions: (() => {
                const version = ask('Supported versions [separate by comma]: ', supportedVersion).split(',').map(v => v.trim());

                return version.filter(v => v && compareVersions(supportedVersion, v));
            })(),
            version: ask('Module version: ', '0.0.1'),
            license: ask('Module license: ', 'ISC'),
            main: ask('Module main file: ', 'index.js'),
            includes: (() => {
                const includes = ask('Module includes [separate by comma]: ').split(',').map(v => v.trim());

                return includes.filter(v => v && existsSync(v));
            })(),
            github: ask('Module github repository: ', ''),
            url: ask('Module url: ', ''),
            dependencies: {},
        };

        console.log(dotReciple);
        const confirm = boolean(input('Is this correct? [y/n] '));
        if (!confirm) return;

        writeFileSync('.reciple', JSON.stringify(dotReciple, null, 2));
    })