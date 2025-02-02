import { AstNodeDescription, AstUtils, DefaultScopeProvider, EMPTY_SCOPE, ReferenceInfo, Scope, UriUtils } from "langium";
import { Entity, Enumeration, EnumerationType, Import, Instance, isAttributeMember, isClassifierImport, isContainsValue, isEntity, isEnumeration, isEnumerationLiteralValue, isEnumerationType, isImport, isInstance, isInstanceAttributeMember, isInstanceMember, isMember, isReferenceType, Module } from "../generated/ast.js";
import { FilterScope } from "./FilterScope.js";

export class KernoScopeProvider extends DefaultScopeProvider {

    protected override getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {
        const globalScope = super.getGlobalScope(referenceType, _context);
        const documentUri = AstUtils.getDocument(_context.container).uri;
        return new FilterScope(globalScope, astDescription => !UriUtils.equals(astDescription.documentUri, documentUri));   
    }

    /**
     * Customize the default scope provider in order to propose the different litterals of the enumeration type in the completion.
     * @param context the reference info
     * @returns the scope
     */
    override getScope(context: ReferenceInfo): Scope {
        if(isClassifierImport(context.container) && context.property === 'imported') {
            return this.getExportedClassifiersFromGlobalScope(context);
        } else if((isReferenceType(context.container) && context.property === 'ref')) {
            return this.getInScopeClassifiers(context);
        } else if(isInstance(context.container) && context.property === 'entityRef') {
            return this.getInScopeClassifierId(context);
        } else if(isImport(context.container) && context.property === 'fromModule') {
            return this.getInScopeModules(context);
        } else if(isEnumerationType(context.container) && context.property === 'enumerationRef') {
            return this.getInScopeEnumerations(context);
        } else if(isEnumerationLiteralValue(context.container) && context.property === 'literalRef') {
            return this.getInScopeLiterals(context);
        } else if(isInstanceMember(context.container) && context.property === 'memberRef') {
            return this.getInScopeProperties(context);
        } else if(isContainsValue(context.container)) {
            return this.getInScopeClassifiers(context, d => isEntity(d.node));
        }
        return EMPTY_SCOPE;
    }

    private getExportedClassifiersFromGlobalScope(context: ReferenceInfo): Scope {
        const import_ = context.container.$container as Import;

        const importedModules = this.indexManager.allElements(Module).filter(module => import_.fromModule?.$refText === module.name).toArray();
        const imported = importedModules.flatMap(m => (m.node as Module).namespaces).map(c => this.descriptions.createDescription(c, c.name));

        for(const classifier of imported) {
            if(isEnumeration(classifier.node)) {
                this.createScopeForNodes(classifier.node.literals);
            }
        }
        return this.createScope(imported);
    }

    private getInScopeClassifiers(context: ReferenceInfo, filter?: (description: AstNodeDescription) => boolean) {
        return this.createScope(this.getImportedClassifiersFromGlobalScope(context, filter));
    }

    private getImportedClassifiersFromGlobalScope(context: ReferenceInfo, filter?: (description: AstNodeDescription) => boolean): AstNodeDescription[] {
        const document = AstUtils.getDocument(context.container);
        const model = document.parseResult.value as Module;
        let descriptions = model.imports.flatMap(fi => fi.imported.map(ci => {
            if (ci.alias) {
                return this.descriptions.createDescription(ci, ci.alias);
            }
            if (ci.imported.ref) {
                return this.descriptions.createDescription(ci.imported.ref, ci.imported.ref.name);
            }
            return undefined;
        }).filter(d => d != undefined)).map(d => d!);
        
        for(const classifier of model.namespaces) {
            descriptions.push(this.descriptions.createDescription(classifier, classifier.name));
        }

        if(filter) {
            return descriptions.filter(filter);
        }

        return descriptions;
    }

    private getInScopeClassifierId(context: ReferenceInfo): Scope {
        let descriptions = this.getImportedClassifiersFromGlobalScope(context)
            .filter(d => isEntity(d.node));
        descriptions.forEach(d => d.name = (d.node as Entity).id);

        return this.createScope(descriptions);
    }

    private getInScopeModules(context: ReferenceInfo): Scope {
        const document = AstUtils.getDocument(context.container);
        const model = document.parseResult.value as Module;
        return this.createScope(this.indexManager.allElements(Module).filter(m => m.name !== model.name));
    }

    private getInScopeEnumerations(context: ReferenceInfo): Scope {
        const document = AstUtils.getDocument(context.container);
        const model = document.parseResult.value as Module;

        const importedEnumerations = this.indexManager.allElements(Enumeration).filter(e => model.imports.flatMap(fi => fi.imported).some(ci => ci.imported.$refText === (e.node as Enumeration).name));
        // const importedLiterals = importedEnumerations.flatMap(e => (e.node as Enumeration).literals);
        // const importedDescriptions = importedLiterals.map(l => this.descriptions.createDescription(l, l.name));
        return this.createScope(importedEnumerations);
    }

    private getInScopeLiterals(context: ReferenceInfo): Scope {
        let enumerationType: string | undefined;
        const attribute = AstUtils.getContainerOfType(context.container, isAttributeMember);
        if(attribute) {
            enumerationType = (attribute?.memberType as EnumerationType).enumerationRef.$refText;
        } else {
            const instanceAttribute = AstUtils.getContainerOfType(context.container, isInstanceAttributeMember);
            if(instanceAttribute) {
                enumerationType = (instanceAttribute.memberRef.ref?.memberType as EnumerationType).enumerationRef.$refText;
            }
        }
        const enumeration = this.indexManager.allElements(Enumeration).find(e => (e.node as Enumeration).name === enumerationType);
        if(enumeration) {
            return this.createScopeForNodes((enumeration.node as Enumeration).literals);
        }
        return EMPTY_SCOPE;
    }

    private getInScopeProperties(context: ReferenceInfo): Scope {
        const instance = context.container.$container as Instance;
        const properties = instance.entityRef.ref?.members.filter(isMember);
        if(properties) {
            return this.createScopeForNodes(properties);
        }
        return EMPTY_SCOPE;
    }
}
