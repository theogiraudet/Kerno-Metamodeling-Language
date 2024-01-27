import { AstNode } from "langium";
import { ArrayValue, AttributeMember, BooleanType, BooleanValue, Documentation, Entity, Enumeration, EnumerationLiteral, EnumerationLiteralValue, EnumerationType, FloatType, FloatValue, IntegerType, IntegerValue, Model, ReferenceMember, ReferenceType, StringType, StringValue } from "../language/generated/ast.js";

export interface Visitor {
  visitModel(node: Model): void;
  visitEntity(node: Entity): void;
  visitEnumeration(node: Enumeration): void;
  visitEnumerationLiteral(node: EnumerationLiteral): void;
  visitArrayValue(node: ArrayValue): void;
  visitAttributeMember(node: AttributeMember): void;
  visitBooleanType(node: BooleanType): void;
  visitBooleanValue(node: BooleanValue): void;
  visiteDocumentation(node: Documentation): void;
  visitEnumerationLiteralValue(node: EnumerationLiteralValue): void;
  visitEnumerationType(node: EnumerationType): void;
  visitFloatValue(node: FloatValue): void;
  visitFloatType(node: FloatType): void;
  visitIntegerValue(node: IntegerValue): void;
  visitIntegerType(node: IntegerType): void;
  visitReferenceMember(node: ReferenceMember): void;
  visitReferenceType(node: ReferenceType): void;
  visitStringType(node: StringType): void;
  visitStringValue(node: StringValue): void;
}


export class Visitable {
  
    visit(node: AstNode, visitor: Visitor) {
    const fun = (visitor as any)["visit" + node.$type];
    if (fun) {
      fun(node);
    } else {
      console.error(
        `The function '${"visit" + node.$type}' is not defined in the visitor '${visitor.constructor.name}'.`
      );
    }
  }
}
