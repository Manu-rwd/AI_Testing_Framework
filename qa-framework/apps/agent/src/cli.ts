#!/usr/bin/env node
import { Command } from 'commander';
import { registerRefineCommand } from './refine.js';
import { registerTrainCommand } from './train.js';
import { registerSuggestCommand } from './suggest.js';

const program = new Command();
program.name('agent').description('QA Manual Refiner Agent (thin v1)');

registerRefineCommand(program);
registerTrainCommand(program);
registerSuggestCommand(program);

program.parse(process.argv);


