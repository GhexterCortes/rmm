#!/usr/bin/env node

import { readdirSync } from 'fs';
import { CommandBuilder } from './reciple-module-manager/util/CommandBuilder';
import { executeCommand } from './reciple-module-manager/util/executeCommand';

const commandFiles = readdirSync(__dirname + `/reciple-module-manager/commands/`).filter(file => file.endsWith('.js'));
const commands = commandFiles.map((file): CommandBuilder  => require(`./reciple-module-manager/commands/${file}`).default).filter(c => c);

executeCommand(commands);