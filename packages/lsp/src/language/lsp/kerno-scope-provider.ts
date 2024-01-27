import { DefaultScopeProvider, ReferenceInfo, Scope } from "langium";
import { isAttributeMember, isEnumerationLiteralValue, isEnumerationType } from "../generated/ast.js";

export class KernoScopeProvider extends DefaultScopeProvider {

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