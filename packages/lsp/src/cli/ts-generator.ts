import { CompositeGeneratorNode, NL } from "langium/generate";
import { Module, Enumeration, EnumerationLiteral, ArrayValue, AttributeMember, BooleanType, BooleanValue, Documentation, EnumerationLiteralValue, EnumerationType, FloatValue, FloatType, IntegerValue, IntegerType, ReferenceMember, ReferenceType, StringType, StringValue, Entity } from "../language/generated/ast.js";
import { Visitable, Visitor } from "./visitor-pattern.js";

export class TsGenerator implements Visitor {

    private visitable: Visitable
    private generatorNode: CompositeGeneratorNode

    constructor(visitable: Visitable, generatorNode: CompositeGeneratorNode) {
        this.visitable = visitable
        this.generatorNode = generatorNode
    }
    visitEntity(node: Entity): void {
        this.visitable.visit(node, this)
        this.generatorNode.append("type", "Model", "{", NL)
        throw new Error("Method not implemented.");
    }
    visitModule(node: Module): void {
        throw new Error("Method not implemented.");
    }
    visitEnumeration(node: Enumeration): void {
        throw new Error("Method not implemented.");
    }
    visitEnumerationLiteral(node: EnumerationLiteral): void {
        throw new Error("Method not implemented.");
    }
    visitArrayValue(node: ArrayValue): void {
        throw new Error("Method not implemented.");
    }
    visitAttributeMember(node: AttributeMember): void {
        throw new Error("Method not implemented.");
    }
    visitBooleanType(node: BooleanType): void {
        throw new Error("Method not implemented.");
    }
    visitBooleanValue(node: BooleanValue): void {
        throw new Error("Method not implemented.");
    }
    visiteDocumentation(node: Documentation): void {
        throw new Error("Method not implemented.");
    }
    visitEnumerationLiteralValue(node: EnumerationLiteralValue): void {
        throw new Error("Method not implemented.");
    }
    visitEnumerationType(node: EnumerationType): void {
        throw new Error("Method not implemented.");
    }
    visitFloatValue(node: FloatValue): void {
        throw new Error("Method not implemented.");
    }
    visitFloatType(node: FloatType): void {
        throw new Error("Method not implemented.");
    }
    visitIntegerValue(node: IntegerValue): void {
        throw new Error("Method not implemented.");
    }
    visitIntegerType(node: IntegerType): void {
        throw new Error("Method not implemented.");
    }
    visitReferenceMember(node: ReferenceMember): void {
        throw new Error("Method not implemented.");
    }
    visitReferenceType(node: ReferenceType): void {
        throw new Error("Method not implemented.");
    }
    visitStringType(node: StringType): void {
        throw new Error("Method not implemented.");
    }
    visitStringValue(node: StringValue): void {
        throw new Error("Method not implemented.");
    }

}