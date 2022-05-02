import chalk from 'chalk';
import { CommandBuilder } from '../util/CommandBuilder';
import { ModulesYml } from '../util/ModulesYML';
import { getRecipleYml } from '../util/reciple.yml';

export default new CommandBuilder()
    .setName('list')
    .setAliases(['ls', 'l'])
    .setDescription('Lists all installed modules')
    .addOption(filter => filter
        .setName('filter')
        .setDescription('Filter the modules by name')
        .setRequired(false)    
    )
    .setExecute(async (options, command, commands) => {
        const filter = options[0] ? options[0].value : '';

        const recipleYml = getRecipleYml();
        const modulesYml = new ModulesYml(recipleYml.version, process.cwd(), recipleYml.modulesFolder);

        const modules = modulesYml.modules.filter(m => filter && (m.name.indexOf(filter) === -1 ? false : true) || !filter);
        if (!modules.length) {
            console.log('No modules installed');
            return;
        }

        console.log('Installed modules:');
        for (const m of modules) {
            console.log(`   ${chalk.bold.blue(m.name)} (${chalk.dim(m.version)}) — ${m.description}`);
            
            if (m.authors && m.authors.length > 0) console.log(`       ${chalk.bold.cyan('Authors:')} ${chalk.italic(m.authors.join(', '))}`);
            
            console.log(`       ${chalk.bold.cyan('Supported Versions:')} ${chalk.italic(m.supportedVersions.join(', '))}`);
            console.log(`       ${chalk.bold.cyan('Dependencies:')} ${chalk.italic(m.dependencies ? Object.keys(m.dependencies).length : 'None')}`);
            
            if (m.github) console.log(`       ${chalk.bold.cyan('GitHub:')} ${chalk.italic(m.github)}`);
            if (m.license) console.log(`       ${chalk.bold.cyan('License:')} ${chalk.italic(m.license)}`);
            if (m.url) console.log(`       ${chalk.bold.cyan('URL:')} ${chalk.italic(m.url)}`);

            console.log('');
        }
    })