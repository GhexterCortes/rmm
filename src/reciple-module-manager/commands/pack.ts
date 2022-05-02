import AdmZip from 'adm-zip';
import chalk from 'chalk';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from 'fs';
import ora from 'ora';
import path from 'path';
import { CommandBuilder } from '../util/CommandBuilder';
import error from '../util/error';
import { Module, ModulesYml } from '../util/ModulesYML';

export default new CommandBuilder()
    .setName('pack')
    .setAliases(['p'])
    .setDescription('Packs a module into a zip file')
    .addOption(output => output
        .setName('output-dir')
        .setDescription('The output directory')
        .setRequired(false)
        .setType('STRING')    
    )
    .addOption(overwrite => overwrite
        .setName('overwrite')
        .setDescription('Overwrite existing files')
        .setRequired(false)
        .setType('BOOLEAN')    
    )
    .setExecute(async (options, command, commands) => {
        let outputDir = options[0].value ? options[0].value : process.cwd();
        let fileName = undefined;

        const overwrite = options[1] ? options[1].value : false;
        
        if (outputDir.endsWith('.zip') && lstatSync(outputDir).isFile()) {
            outputDir = path.dirname(outputDir);
            fileName = path.basename(outputDir);
        }

        mkdirSync(outputDir, { recursive: true });
        
        if (!existsSync('.reciple')) error('No .reciple file found in the current directory');

        const dotReciple: Module = JSON.parse(readFileSync('.reciple', 'utf8'));
        try { ModulesYml.validateModule(dotReciple); } catch (err) { error(err as Error); }

        const zip = new AdmZip();
        const spinner = ora({ text: 'Packing module...', spinner: 'dots12' }).start();

        try {
            spinner.text = `Adding ${chalk.blue(dotReciple.main)}`;
            zip.addLocalFile(path.join(process.cwd(), dotReciple.main));

            spinner.text = `Adding ${chalk.blue('.reciple')}`;
            zip.addLocalFile(path.join(process.cwd(), '.reciple'));

            if (dotReciple.includes) {
                for (const file of dotReciple.includes) {
                    spinner.text = `Adding ${chalk.blue(file)}`;

                    if (!existsSync(file)) throw new Error(`File ${chalk.yellow(file)} does not exist`);

                    if (lstatSync(file).isDirectory()) {
                        zip.addLocalFolder(path.join(process.cwd(), file));
                    } else {
                        zip.addLocalFile(path.join(process.cwd(), file));
                    }
                }
            }

            spinner.text = `Creating archive ${chalk.blue(fileName || dotReciple.name)}`;
            fileName = fileName || (dotReciple.name + '.zip');

            if (existsSync(path.join(outputDir, fileName)) && !overwrite) throw new Error(`File ${chalk.yellow(fileName)} already exists`);
            if (existsSync(path.join(outputDir, fileName))) rmSync(path.join(outputDir, fileName), { recursive: true, force: true });

            zip.writeZip(path.join(outputDir, fileName));
            spinner.succeed(`Module ${chalk.blue(dotReciple.name)} packed successfully to ${chalk.yellow(path.join(outputDir, fileName))}`);
        } catch (err) {
            spinner.fail((err as Error).message);
        }
    });