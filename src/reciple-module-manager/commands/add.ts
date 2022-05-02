import { replaceAll } from 'fallout-utility';
import { existsSync } from 'fs';
import { CommandBuilder } from '../util/CommandBuilder';
import { ModulesYml } from '../util/ModulesYML';
import { getRecipleYml } from '../util/reciple.yml';

export default new CommandBuilder()
    .setName('add')
    .setAliases(['install', 'i'])
    .setDescription('Installs a module from a github repository or a local zip')
    .addOption(module_ => module_
        .setName('module')
        .setDescription('The module to install')
        .setRequired(true)
        .setType('STRING')
    )
    .setExecute(async (options, command, commands) => {
        let github = false;

        try {
            if (!existsSync(options[0].value)) {
                github = !!ModulesYml.githubRelease(replaceAll(options[0].value, 'github:', ''));
            }
        } catch (err) {
            github = false;
        }

        const recipleYml = getRecipleYml();
        const modulesYml = new ModulesYml(recipleYml.version, process.cwd(), recipleYml.modulesFolder);
    
        if (github) {
            await modulesYml.addGitHub(options[0].value);
        } else {
            await modulesYml.addZip(options[0].value);
        }
    })