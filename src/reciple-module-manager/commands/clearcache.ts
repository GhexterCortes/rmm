import { rmSync } from 'fs';
import { CommandBuilder } from '../util/CommandBuilder';

export default new CommandBuilder()
    .setName('clearcache')
    .setAliases(['cc'])
    .setDescription('Clears the rmm cache in the current directory')
    .setExecute(() => {
        rmSync('./.rmmcache', { recursive: true, force: true });
    })