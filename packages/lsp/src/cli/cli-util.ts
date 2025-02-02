import chalk from 'chalk';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { URI } from 'langium';
import { LangiumServices } from 'langium/lsp';
import * as util from 'util'

export async function extractDocument(fileName: string, services: LangiumServices) {
    const extensions = services.LanguageMetaData.fileExtensions;
    if (!extensions.includes(path.extname(fileName))) {
        console.error(chalk.yellow(`Please choose a file with one of these extensions: ${extensions}.`));
        process.exit(1);
    }

    if (!fs.existsSync(fileName)) {
        console.error(chalk.red(`File ${fileName} does not exist.`));
        process.exit(1);
    }

    services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(fileName))).then(doc => { 
        return services.shared.workspace.DocumentBuilder.build([doc], { validation: true }).then(_ => doc);
    }).then(doc => {
    const validationErrors = (doc.diagnostics ?? []).filter(e => e.severity === 1);
    if (validationErrors.length > 0) {
        console.error(chalk.red('There are validation errors:'));
        for (const validationError of validationErrors) {
            console.error(chalk.red(
                `line ${validationError.range.start.line + 1}: ${validationError.message} [${doc.textDocument.getText(validationError.range)}]`
            ));
        }
        process.exit(1);
    }

    console.log(util.inspect(doc.parseResult.value));
    });
}

// export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumServices): Promise<T> {
//     return (await extractDocument(fileName, services)).parseResult?.value as T;
// }

interface FilePathData {
    destination: string,
    name: string
}

export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
    filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? path.join(path.dirname(filePath), 'generated'),
        name: path.basename(filePath)
    };
}
