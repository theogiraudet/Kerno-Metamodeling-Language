import {  AstNodeDescription, AstUtils, DefaultScopeComputation, LangiumDocument } from "langium";
import { LangiumServices } from "langium/lsp";
import { isClassifier, isModule } from "../generated/ast.js";

export class KernoScopeComputation extends DefaultScopeComputation {
    
    constructor(services: LangiumServices) {
        super(services);
    }

    override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];
        for (const childNode of AstUtils.streamAst(document.parseResult.value)) {
            if ((isClassifier(childNode) || isModule(childNode)) && childNode.name) {
                exportedDescriptions.push(this.descriptions.createDescription(childNode, childNode.name, document));
            }
        }
        return exportedDescriptions;
    }
}