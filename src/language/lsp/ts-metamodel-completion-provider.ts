import { CompletionAcceptor, CompletionContext, DefaultCompletionProvider, GrammarAST, MaybePromise, NextFeature } from "langium";
import { BooleanValue, isAttributeMember } from "../generated/ast.js";
import { getValueTypeNameFromType } from "../type-system.js";

export class TsMetamodelCompletionProvider extends DefaultCompletionProvider { 

    
    /** 
     * Customize the default completions for values.
     * If the type of the attribute is boolean, only the keywords true and false are suggested, as specified in the grammar.
     * If the type of the attribute is an enumeration, the enumeration literals are suggested.
     * Else, the default behavior is used.
     * @param context the completion context
     * @param next the next feature to complete
     * @param acceptor the completion acceptor
     */
    override completionFor(context: CompletionContext, next: NextFeature, acceptor: CompletionAcceptor): MaybePromise<void> {
        if(isAttributeMember(context.node) && context.features[0]?.type?.endsWith('Value')) {
            const valueTypeName = getValueTypeNameFromType(context.node.type);
            if(valueTypeName === BooleanValue && GrammarAST.isKeyword(next.feature)) {
                return this.completionForKeyword(context, next.feature, acceptor);
            } else if (GrammarAST.isCrossReference(next.feature) && context.node) {
                return this.completionForCrossReference(context, next as NextFeature<GrammarAST.CrossReference>, acceptor);
            }
        } else {
            return super.completionFor(context, next, acceptor);
        }
    }

}