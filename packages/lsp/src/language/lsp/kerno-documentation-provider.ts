import { AstNode, JSDocDocumentationProvider, parseJSDoc } from "langium";
import { isDocumentable } from "../generated/ast.js";

export class KernoDocumentationProvider extends JSDocDocumentationProvider {
    
    override getDocumentation(node: AstNode): string | undefined {
        if(isDocumentable(node) && node.documentation) {
            const parsedJSDoc = parseJSDoc(node.documentation.text);
            return parsedJSDoc.toMarkdown({
                renderLink: (link, display) => {
                    return this.documentationLinkRenderer(node, link, display);
                },
                renderTag: (tag) => {
                    return this.documentationTagRenderer(node, tag);
                }
            });
        }
        return undefined;
    }

}