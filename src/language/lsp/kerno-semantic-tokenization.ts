import { AbstractSemanticTokenProvider, AstNode, SemanticTokenAcceptor } from "langium";
import { isAttributeType, isClassifier, isEntity, isEnumeration, isEnumerationType, isMember, isPrimitiveValue, isReferenceType } from "../generated/ast.js";
import { SemanticTokenTypes } from "vscode-languageserver";

export class KernoSemanticTokenization extends AbstractSemanticTokenProvider {

    protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        if(isClassifier(node)) {
            acceptor({ node, property: "name", type: SemanticTokenTypes.type })
            if(isEntity(node)) {
                acceptor({ node, keyword: "entity", type: SemanticTokenTypes.macro })
            } else if(isEnumeration(node)) {
                acceptor({ node, keyword: "enumeration", type: SemanticTokenTypes.macro })
                acceptor({ node, property: "literals", type: SemanticTokenTypes.enumMember })
            }
        } else if(isMember(node)) {
            acceptor({ node, property: "name", type: SemanticTokenTypes.property })
        }  else if(isEnumerationType(node)) {
            acceptor({ node, property: "enumerationRef", type: SemanticTokenTypes.type })
        } else if(isAttributeType(node)) {
            acceptor({ node, property: "name", type: SemanticTokenTypes.type })
        } else if(isReferenceType(node)) {
            acceptor({ node, property: "ref", type: SemanticTokenTypes.type })
        } else if(isPrimitiveValue(node)) {
            switch(node.$type) {
                case "BooleanValue": acceptor({ node, property: "value", type: SemanticTokenTypes.macro })
                case "IntegerValue": acceptor({ node, property: "value", type: SemanticTokenTypes.number })
                case "FloatValue": acceptor({ node, property: "value", type: SemanticTokenTypes.number })
                case "EnumerationLiteralValue": {
                    acceptor({ node, property: "enumerationRef", type: SemanticTokenTypes.type })
                    acceptor({ node, property: "literalRef", type: SemanticTokenTypes.property })
                }
            }
        } else if(isMember(node)) {
            acceptor({ node, property: "lowerBound", type: SemanticTokenTypes.number })
            acceptor({ node, property: "upperBound", type: SemanticTokenTypes.number })
        }
    }

}