import { DefaultScopeProvider, EMPTY_SCOPE, ReferenceInfo, Scope } from "langium";
import { EnumerationType, isEnumerationLiteralValue } from "../generated/ast.js";

export class TsMetamodelScopeProvider extends DefaultScopeProvider {

    override getScope(context: ReferenceInfo): Scope {
        if (context.property === 'literalRef') {
            console.log(context.container.$type)
            if(isEnumerationLiteralValue(context.container)) {
                const attribute = context.container;
                const type = attribute as any as EnumerationType
                if(isEnumerationLiteralValue(attribute)) {
                    return this.createScopeForNodes(type.enumerationRef.ref!.literals);
                } else {
                    return EMPTY_SCOPE;        
                }
            }
        }
        return super.getScope(context);
    }

}