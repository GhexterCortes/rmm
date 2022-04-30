import { CommandBuilder } from '../util/CommandBuilder';

export default new CommandBuilder()
    .setName('version')
    .setAliases(['v'])
    .setDescription('Prints the version of the application')
    .setExecute(() => {
        console.log(require('../../../package.json').version ?? 'No version available');
    })