import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { KernoServices } from './kerno-module.js';
import { startLanguageServer } from 'langium/lsp';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = KernoServices({ connection, ...NodeFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);
