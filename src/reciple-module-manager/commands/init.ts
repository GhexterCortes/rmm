import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';
import yml from 'yaml';
import { CommandBuilder } from '../util/CommandBuilder';
import error from '../util/error';
import getPaackageJSON from '../util/getPackageJSON';

export default new CommandBuilder()
    .setName('init')
    .setDescription('Initializes modules.yml')
    .setExecute(async (options, command, commands) => {
        let packageJSON = await Promise.resolve(getPaackageJSON()).catch(err => error(err));
        
        if (!packageJSON.dependencies?.reciple && !packageJSON.devDependencies?.reciple) error(`No ${chalk.yellow('reciple')} dependency found in ${chalk.yellow('package.json')}`);
        if (existsSync('modules.yml')) error('modules.yml already exists'); 

        const modulesYML = yml.stringify([]);

        writeFileSync('modules.yml', modulesYML);
    });