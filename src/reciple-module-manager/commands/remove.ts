import { boolean } from 'boolean';
import { input } from 'fallout-utility';
import { CommandBuilder } from '../util/CommandBuilder';
import { ModulesYml } from '../util/ModulesYML';
import { getRecipleYml } from '../util/reciple.yml';

export default new CommandBuilder()
    .setName('remove')
    .setAliases(['uninstall', 'un', 'rm'])
    .setDescription('Removes a module from the modules.yml')
    .addOption(module_ => module_
        .setName('module')
        .setDescription('The module to remove')
        .setRequired(true)
        .setType('STRING')
    )
    .addOption(confirmPrompt => confirmPrompt
        .setName('confirm')
        .setDescription('Confirm prompts')
        .setRequired(false)
        .setType('BOOLEAN')    
    )
    .setExecute(async (options, command, commands) => {
        const autoconfirm = options[1] ? options[1].value : false;
        const recipleYml = getRecipleYml();
        const modulesYml = new ModulesYml(recipleYml.version, process.cwd(), recipleYml.modulesFolder);
        
        const confirm = autoconfirm || input(`Are you sure you want to remove this module? (y/n) `);
        if (!boolean(confirm)) return;

        modulesYml.remove(options[0].value);
    })