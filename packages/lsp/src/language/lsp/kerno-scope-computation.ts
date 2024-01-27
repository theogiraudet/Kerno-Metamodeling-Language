import { AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument, LangiumServices, MultiMap, PrecomputedScopes, streamAllContents } from "langium";
import { Model, isClassifier } from "../generated/ast.js";

export class KernoScopeComputation extends DefaultScopeComputation {
    
    constructor(services: LangiumServices) {
        super(services);
    }

    override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];
        for (const childNode of streamAllContents(document.parseResult.value)) {
            if (isClassifier(childNode)) {
                const fullyQualifiedName = `${childNode.$container.module}.${childNode.name}`;
                exportedDescriptions.push(this.descriptions.createDescription(childNode, fullyQualifiedName, document));
            }
        }
        return exportedDescriptions;
    }

    override async computeLocalScopes(document: LangiumDocument): Promise<PrecomputedScopes> {
        const model = document.parseResult.value as Model;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        this.processContainer(model, scopes, document);
        return scopes;
    }

    private processContainer(container: Model, scopes: PrecomputedScopes, document: LangiumDocument): AstNodeDescription[] {
        const localDescriptions: AstNodeDescription[] = [];
        for (const element of container.namespaces) {
            if (isClassifier(element)) {
                const description = this.descriptions.createDescription(element, element.name, document);
                localDescriptions.push(description);
            }
        }
        scopes.addAll(container, localDescriptions);
        return localDescriptions;
    }

}