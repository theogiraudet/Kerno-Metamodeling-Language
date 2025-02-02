import { AstReflection, DiagnosticData, DocumentValidator, IndexManager, isCompositeCstNode, isLeafCstNode, LangiumDocument, LinkingErrorData, MaybePromise, Reference, ReferenceInfo } from "langium";
import type { Diagnostic } from 'vscode-languageserver';
import type { CodeActionParams } from 'vscode-languageserver-protocol';
import type { CodeAction, Command, WorkspaceEdit, Position } from 'vscode-languageserver-types';
import { CodeActionKind } from 'vscode-languageserver-types';
import { KernoServices } from "../kerno-module.js";
import { EnumerationType, Instance, isAttributeMember, isBooleanType, isEnumerationType, isFloatType, isInstance, isIntegerType, isReferenceMember, isReferenceType, isStringType, Member, Module, ReferenceType, Type } from "../generated/ast.js";
import { MissingMembersError, MissingMembersErrorData } from "../kerno-validator.js";
import { CstUtils } from "langium";

export class KernoCodeActionProvider {

    private readonly reflection: AstReflection;
    private readonly indexManager: IndexManager;

    constructor(services: KernoServices) {
        this.reflection = services.shared.AstReflection;
        this.indexManager = services.shared.workspace.IndexManager;
    }

    getCodeActions(document: LangiumDocument, params: CodeActionParams): MaybePromise<Array<Command | CodeAction>> {
        const result: CodeAction[] = [];
        const acceptor = (ca: CodeAction | undefined) => ca && result.push(ca);
        for (const diagnostic of params.context.diagnostics) {
            this.createCodeActions(diagnostic, document, acceptor);
        }
        return result;
    }

    private createCodeActions(diagnostic: Diagnostic, document: LangiumDocument, accept: (ca: CodeAction | undefined) => void): void {
        switch ((diagnostic.data as DiagnosticData)?.code) {
            case DocumentValidator.LinkingError: {
                const data = diagnostic.data as LinkingErrorData;
                if (data) {
                    this.lookInGlobalScope(diagnostic, data, document).forEach(accept);
                    const newClassifier = this.addNewClassifier(diagnostic, data, document);
                    if(newClassifier) {
                        accept(newClassifier);
                    }
                }
                break;
            }
            case MissingMembersError: {
                const data = diagnostic.data as MissingMembersErrorData;
                const missingMembers = this.addMissingMembers(diagnostic, data, document);
                if(missingMembers) {
                    accept(missingMembers);
                }
                break;
            }
        }
    }

    
    private addMissingMembers(diagnostic: Diagnostic, data: MissingMembersErrorData, document: LangiumDocument): CodeAction | undefined {
        const instance = (document.parseResult.value as Module).namespaces.find(classifier => isInstance(classifier) && classifier.name === data.instance) as Instance | undefined;
        const missingMembers = instance?.entityRef.ref?.members.filter(member => data.missingMembers.includes(member.name)).filter(isAttributeMember);
        if(instance && missingMembers) {
            let suffix = "";
            let position: Position | undefined = undefined;
            if(instance.members.length > 0) {
                position = instance.members.at(-1)!.$cstNode!.range.end;
            } else {
                // @ts-ignore
                const cst = CstUtils.streamCst(instance.$cstNode!).find(cst => isLeafCstNode(cst) && cst.text === '{');
                position = cst!.range.end;
                const end = instance.$cstNode!.range.end;
                if(position) {
                    position.character = position.character;
                    if(end.line === position.line) {
                        suffix = "\n";
                    }

                }
            }

            const stringMembers = missingMembers.map(mem => "\t" + this.memberToString(mem)).join('\n');

            return {
                title: `Add missing properties`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                isPreferred: false,
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: {
                                start: position!,
                                end: position!
                            },
                            newText: "\n" + stringMembers + suffix
                        }]
                    }
                }
            };
        }
        return undefined;
    }


    private memberToString(member: Member): string {
        let memberString: string | undefined = undefined;
        if(isAttributeMember(member)) {
            memberString = 'prop';
        } else if(isReferenceMember(member)) {
            memberString = member.contains ? 'contains' : 'refers';
        }

        memberString += ` ${member.name} = `;

        if(member.value) {
            memberString += member.value.$cstNode?.text!;
        } else {
            if(member.bound) {
                memberString += '[ ';
                memberString += [...Array(member.lowerBound! + 1).keys()].map(i => this.typeToValue(member.memberType, i)).join(', ');
                memberString += ' ]';
            } else {
                memberString += this.typeToValue(member.memberType, 0);
            }
        }

        return memberString!;
    }

    private typeToValue(type: Type, offset: number): string {
        if(isEnumerationType(type)) {
            const literals = type.enumerationRef.ref?.literals;
            if(literals) {
                return literals[offset % literals.length].name;
            }
        } else if(isIntegerType(type)) {
            return (0 + offset).toString();
        } else if(isFloatType(type)) {
            return (0.0 + offset).toString();
        } else if(isStringType(type)) {
            return `"${offset}"`;
        } else if(isBooleanType(type)) {
            return offset % 2 === 0 ? 'false' : 'true';
        } else if(isReferenceType(type)) {
            return 'null';
        }
        throw new Error('Unsupported type');
    }


    /**
     * Create a new classifier at the end of the document.
     * @param diagnostic the diagnostic to create the code action for
     * @param data the linking error data
     * @param document the document to look in
     * @returns the code action
     */
    private addNewClassifier(diagnostic: Diagnostic, data: LinkingErrorData, document: LangiumDocument): CodeAction | undefined {
        let text: string | undefined = undefined;
        const name = data.refText;

        if(data.containerType === ReferenceType) {
            const id = name.toLowerCase().replace(/ /g, '_');
            text = `entity ${name}(${id})`;
        } else if(data.containerType === EnumerationType) {
            text = `enumeration ${name}`;
        }

        const position = document.parseResult.value.$cstNode?.range.end;

        if(position) {
            return {
                title: `Create new ${ text?.split(" ")[0] } '${ name }'`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                isPreferred: false,
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: {
                                start: position,
                                end: position
                            },
                            newText: `\n\n${ text } {\n\n}`
                        }]
                    }
                }
            };
        }
        return undefined;

    }


    /**
     * Look for references in the global scope.
     * @param diagnostic the diagnostic to create the code action for
     * @param data the linking error data
     * @param document the document to look in
     * @returns the code actions
     */
    private lookInGlobalScope(diagnostic: Diagnostic, data: LinkingErrorData, document: LangiumDocument): CodeAction[] {
        const refInfo: ReferenceInfo = {
            container: {
                $type: data.containerType
            },
            property: data.property,
            reference: {
                $refText: data.refText
            } as Reference
        };
        const referenceType = this.reflection.getReferenceType(refInfo);
        const candidates = this.indexManager.allElements(referenceType).filter(e => e.name === data.refText || (e.node as any)["id"] === data.refText);

        const result: CodeAction[] = [];
        const currentModule = document.parseResult.value as Module;

        for(const candidate of candidates) {
            const name = candidate.name;
            const module = candidate.node?.$container as Module;
            const moduleName = module.name;

            const existingImport = currentModule.imports.find(i => i.fromModule.ref === module);
            let workspaceEdit: WorkspaceEdit | undefined = undefined;

            // If an import from this module is already present, we want to add the entity name to the existing import
            if(existingImport && existingImport.imported.at(-1)?.$cstNode) {

                const position = existingImport.imported.at(-1)!.$cstNode!.range.end;
                const needComma = existingImport.imported.length > 0;

                workspaceEdit = {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: {
                                start: position,
                                end: position
                            },
                            newText: needComma ? `, ${name}` : name
                        }]
                    }
                }
            } else if(!existingImport && currentModule.imports && isCompositeCstNode(currentModule.$cstNode)) {
                const asNoImport = currentModule.imports.length === 0;
                const position = asNoImport ? currentModule.$cstNode.content[1].range.end : currentModule.imports.at(-1)!.$cstNode!.range.end;

                workspaceEdit = {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: {
                                start: position,
                                end: position
                            },
                            newText: `${asNoImport ? '\n\n' : '\n'}import { ${name} } from ${moduleName}`
                        }]
                    }
                }
            }


            result.push({
                title: `Add import to '${ name }' from module '${ moduleName }'`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                isPreferred: false,
                edit: workspaceEdit
            });
        }
        return result;
    }
}