import { AstNodeDescription, Scope, Stream } from "langium";

export class FilterScope implements Scope {

    readonly globalScope: Scope;
    readonly filter: (element: AstNodeDescription) => boolean;

    constructor(globalScope: Scope, filter: (element: AstNodeDescription) => boolean) {
        this.globalScope = globalScope;
        this.filter = filter;
    }

    getElement(name: string): AstNodeDescription | undefined {
        const element = this.globalScope.getElement(name);
        if(element && this.filter(element)) {
            return element;
        }
        return undefined;
    }
    getAllElements(): Stream<AstNodeDescription> {
        return this.globalScope.getAllElements().filter(this.filter);
    }
}