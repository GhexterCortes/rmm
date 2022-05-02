import AdmZip from 'adm-zip';
import axios from 'axios';
import chalk from 'chalk';
import { randomUUID } from 'crypto';
import { trimChars } from 'fallout-utility';
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, lstatSync } from 'fs';
import { async as AsyncZip } from 'node-stream-zip';
import ora, { Ora } from 'ora';
import path from 'path';
import yml from 'yaml';
import compareVersions from './compareVersions';
import error from './error';
import getPackageJSON from './getPackageJSON';
import supportedVersion from './supportedVersion';

export interface Module {
    name: string;
    main: string;
    version: string;
    includes: string[];
    description: string;
    supportedVersions: string[];
    dependencies: { [name: string]: string };
    authors?: string[];
    license?: string;
    github?: string;
    url?: string; 
}

export class ModulesYml {
    public version: string;
    public path: string;
    public modulesFolder: string;
    public modules: Module[] = [];

    constructor (version: string, savedir?: string, modulesFolder?: string, modules?: Module[]) {
        this.version = version;
        this.path = savedir ?? './';
        this.modulesFolder = modulesFolder ?? './modules';
        this.modules = modules ?? [];
    }

    public async addZip(zipPath: string, spin?: Ora): Promise<ModulesYml> {
        const cwd = path.join(process.cwd(), this.modulesFolder);
        const spinner = spin ?? ora({ text: `Adding ${chalk.yellow(zipPath)}`, spinner: 'dots12' }).start();

        try {
            if (!existsSync(zipPath)) throw new Error('Zip file not found');
            const zip = new AsyncZip({
                file: zipPath,
                storeEntries: true
            });

            const entries = await zip.entries().catch(err => {throw err});
            if (!Object.keys(entries).length) throw new Error('Empty zip');
            if (!entries['.reciple']) throw new Error('No .reciple file found');
            if (!entries['.reciple'].isFile) throw new Error('No .reciple file found');

            const reciple = ModulesYml.validateModule(await zip.entryData(entries['.reciple']).then(data => JSON.parse(data.toString())));
            if (!reciple.supportedVersions.includes(this.version)) throw new Error(`Module ${chalk.yellow(reciple.name)} does not support ${chalk.yellow(this.version)}`);

            const conflictedModule = this.modules.find(m => m.name === reciple.name);
            if (conflictedModule) {
                if (!compareVersions(conflictedModule.version, reciple.version)) {
                    throw new Error(`${chalk.yellow(conflictedModule.name)} is already installed and is newer than ${chalk.yellow(reciple.name)}`);
                }

                spinner.text = `Removing ${chalk.yellow(path.join(cwd, conflictedModule.main))}`;
                await this.remove(conflictedModule.name);
            }

            const conflictedFiles = readdirSync(cwd).filter(f => f == reciple.main || reciple.includes.includes(f));
            if (conflictedFiles.length) throw new Error(`${chalk.yellow(conflictedFiles.join(', '))} conflicts with ${chalk.yellow(reciple.name)}`);

            spinner.text = `Adding ${chalk.yellow(reciple.main)}`;
            for (const entry of Object.values(entries)) {
                if (reciple.name !== entry.name && !reciple.includes.includes(entry.name)) continue;

                spinner.text = `Extracting ${chalk.yellow(entry)}`;

                await zip.entryData(entry).then(data => writeFileSync(path.join(cwd, entry.name), data));
            }

            spinner.succeed(`${chalk.yellow(reciple.name)} added`);
            this.add(reciple);
        } catch (err) {
            spinner.fail((err as Error).message);
            return this;
        }

        return this;
    }

    public async addGitHub(github: string, spin?: Ora): Promise<ModulesYml> {
        const spinner = spin ?? ora({ text: `Adding ${chalk.yellow(github)}`, spinner: 'dots12' }).start();

        try {
            const githubModule = ModulesYml.githubRelease(github);
            const downloadUrl = `https://api.github.com/repos/${githubModule.owner}/${githubModule.repo}/releases/${githubModule.version !== 'latest' ? 'tags/v'+githubModule.version : githubModule.version}`;

            spinner.text = `Downloading ${chalk.yellow(downloadUrl)}`;
            const download = await axios.get(downloadUrl).then(res => res.data).catch(err => {throw err});
            if (!download || !download?.zipball_url) throw new Error('No assets found');

            const zipHttp = await axios.get(download.zipball_url, { responseType: 'stream' }).catch(err => {throw err});
            const zipPath = path.join(this.path, '.rmmcache/'+ randomUUID() +'/'+ githubModule.owner +'/'+ githubModule.repo +'.zip');

            mkdirSync(path.dirname(zipPath), { recursive: true });

            zipHttp.data.pipe(createWriteStream(zipPath));
            zipHttp.data.on('error', (err: Error) => {throw err});
            zipHttp.data.on('end', async () => {
                spinner.text = `Parsing ${chalk.yellow(path.basename(zipPath))}`;

                const zip = new AsyncZip({
                    file: zipPath,
                    storeEntries: true
                });

                const firstEntry = Object.values(await zip.entries())[0];
                if (!firstEntry?.isDirectory) throw new Error('First entry is not a directory');

                const modulePath = path.join(path.dirname(zipPath), 'module');

                mkdirSync(modulePath, { recursive: true });
                await zip.extract(firstEntry.name, modulePath);

                const moduleZip = new AdmZip();
                const entries = readdirSync(modulePath);

                for (const entry of entries) {
                    spinner.text = `Extracting ${chalk.yellow(entry)}`;

                    const entryPath = path.join(modulePath, entry);

                    if (lstatSync(entryPath).isDirectory()) {
                        moduleZip.addLocalFolder(entryPath);
                        continue;
                    }
                    moduleZip.addLocalFile(path.join(modulePath, entry));
                }

                const moduleZipPath = path.join(modulePath, '../module.zip');
                spinner.text = `Writing ${chalk.yellow(path.basename(moduleZipPath))}`;

                moduleZip.writeZip(moduleZipPath);

                this.addZip(moduleZipPath, spinner);
            });
        } catch (err) {
            spinner.fail((err as Error).message);
            return this;
        }

        return this;
    }

    public add(module: Module): ModulesYml {
        if (this.modules.find(m => m.name === module.name)) error(`Module ${chalk.yellow(module.name)} already exists`);

        this.modules.push(module);
        this.save();

        return this;
    }

    public async remove(name: string): Promise<ModulesYml> {
        const spinner = ora({ text: `Removing ${chalk.yellow(name)}`, spinner: 'dots12' }).start();

        try {
            const cwd = path.join(process.cwd(), this.modulesFolder);
            const m = this.modules.find(_ => _.name === name);

            if (!m) {
                spinner.fail(`Module ${chalk.yellow(name)} not found`);
                return this;
            }

            spinner.text = `Removing ${chalk.yellow(path.join(cwd, m.main))}`;

            rmSync(path.join(cwd, m.main), {  recursive: true, force: true });
            
            for (const include of m.includes) {
                spinner.text = `Removing ${chalk.yellow(path.join(cwd, include))}`;
                rmSync(path.join(cwd, include), { recursive: true, force: true });
            }

            spinner.succeed(`${chalk.yellow(name)} removed`);
        } catch (err) {
            spinner.fail((err as Error).message);
            return this;    
        }

        this.modules = this.modules.filter(m => m.name !== name);
        this.save();

        return this;
    }

    public save(): ModulesYml {
        const packageJSON = getPackageJSON();
        const modulesYML = yml.stringify(this.modules);

        const spinner = ora({ text: `Updating ${chalk.yellow('package.json')}`, spinner: 'dots12' }).start();
        const packageJsonDepencies: { [packageName: string]: any } = packageJSON?.dependencies ?? {};

        let newDependencies = packageJsonDepencies;
        let ignoredDependencies: Set<string> = new Set();

        for (const m of this.modules) {
            const dependencies = Object.keys(m?.dependencies) ?? [];
            const moduleDependencies = dependencies.filter(d => !packageJsonDepencies[d]);
            
            for (const dependency of dependencies.filter(d => !moduleDependencies.includes(d))) {
                spinner.text = `Ignoring ${chalk.yellow(dependency)}`;
                ignoredDependencies.add(dependency);
            }

            for (const dependency of moduleDependencies) {
                spinner.text = `Adding ${chalk.yellow(dependency)}`;
                newDependencies[dependency] = m.dependencies[dependency];
            }
        }

        spinner.text = `Creating ${chalk.yellow('package.json.old')}`;
        writeFileSync(path.join(process.cwd(), 'package.json.old'), JSON.stringify(packageJSON, null, 2));

        spinner.text = `Updating ${chalk.yellow('package.json')}`;
        packageJSON.dependencies = ModulesYml.sortDependencies(newDependencies);
        writeFileSync(path.join(process.cwd(), 'package.json'), JSON.stringify(packageJSON, null, 2));

        spinner.text = `Updating ${chalk.yellow('modules.yml')}`;
        writeFileSync(path.join(this.path, 'modules.yml'), modulesYML);

        spinner.succeed(`Modules updated`);

        if (ignoredDependencies.size) {
            console.log(chalk.yellow(`Ignored dependencies: ${Array.from(ignoredDependencies).join(', ')}`));
        }

        console.log(`Run ${chalk.blue('npm install')} to install new dependencies`);

        return this;
    }

    public load(): ModulesYml {
        if (!existsSync('modules.yml')) error(`No ${chalk.yellow('modules.yml')} found in ${chalk.yellow(process.cwd())}. Run ${chalk.yellow('rmm init')} to create one.`);

        const modulesYML = readFileSync(path.join(this.path, 'modules.yml'), 'utf8');
        this.modules = yml.parse(modulesYML);

        if (compareVersions(supportedVersion, this.version)) error(`Unsupported version ${chalk.yellow(this.version)}`);
        return this;
    }

    public static validateModule(m: Module): Module {
        if (!m.name || !/^[\w-]{1,32}$/.test(m.name)) throw new Error('Module name is invalid');
        if (!m.version) throw new Error('Module version is required');
        if (m.description && m.description.length > 200) throw new Error('Module description is too long');
        if (!m.supportedVersions || !m.supportedVersions.length) throw new Error('Module supportedVersions is required');
        if (!m.main) throw new Error('Module main is required');

        return m;
    }

    public static githubRelease(github: string) {
        const [owner, repo] = github.split('/');
        if (github.split('/').length > 2 || !owner || !repo) throw new Error('Invalid github url');

        return {
            owner,
            repo: repo.split('@')[0],
            version: trimChars(repo.split('@')[1] ?? 'latest', 'v')
        }
    }

    public static sortDependencies(dependencies: { [key: string]: string }) {
        const sortedDependencies: { [key: string]: string } = {};
        const keys = Object.keys(dependencies).sort();

        for (const key of keys) {
            sortedDependencies[key] = dependencies[key];
        }

        return sortedDependencies;
    }
}