import { DefaultScopeProvider, ReferenceInfo, Scope, UriUtils, getDocument } from "langium";
import { isAttributeMember, isEnumerationLiteralValue, isEnumerationType } from "../generated/ast.js";
import { FilterScope } from "./FilterScope.js";

export class KernoScopeProvider extends DefaultScopeProvider {

    protected override getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {
        const globalScope = super.getGlobalScope(referenceType, _context);
        const documentUri = getDocument(_context.container).uri;
        return new FilterScope(globalScope, astDescription => !UriUtils.equals(astDescription.documentUri, documentUri));   
    }

    /**
     * Customize the default scope provider in order to propose the different litterals of the enumeration type in the completion.
     * @param context the reference info
     * @returns the scope
     */
    override getScope(context: ReferenceInfo): Scope {
        if (context.property === 'literalRef') {
            if(isEnumerationLiteralValue(context.container)) {
                const literalValue = context.container;
                if(isAttributeMember(literalValue.$container)) {
                    const attributeMember = literalValue.$container
                    if(isEnumerationType(attributeMember.type)) {
                        return this.createScopeForNodes(attributeMember.type.enumerationRef.ref!.literals);
                    }

                }
            }
        }
        return super.getScope(context);
    }

}