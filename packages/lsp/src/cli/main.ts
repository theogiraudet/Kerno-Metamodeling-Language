
import 'chalk';
import { Command } from 'commander';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { KernoLanguageMetaData } from '../language/generated/module.js';
import { KernoServices } from '../language/kerno-module.js';
import { NodeFileSystem } from 'langium/node';
import { extractDocument } from './cli-util.js';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const generateAction = async (fileName: string): Promise<void> => {
    const services = KernoServices(NodeFileSystem).Kerno;
    // const model = await extractAstNode<Model>(fileName, services);
    await extractDocument(fileName, services);
    // const generatedFilePath = generateTypeScript(model, fileName, opts.destination);
    // console.log(chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`));
};


const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

const program = new Command();

program.version(JSON.parse(packageContent).version);

program
    .command('display')
    .argument('<file>', `possible file extensions: ${KernoLanguageMetaData.fileExtensions.join(', ')}`)
    .description('calculates Evaluations in the source file')
    .action(generateAction);

program.parse(process.argv);
