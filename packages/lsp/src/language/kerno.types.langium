interface Documentation {
    text: string
}

interface Model {
    module: string
    namespaces: Classifier[]
}

type NamedElement = Classifier | EnumerationLiteral
type Classifier = Entity | Enumeration

interface Entity {
    name: string
    documentation?: Documentation
    members: Member[]
}

interface Enumeration {
    name: string
    documentation?: Documentation
    literals: EnumerationLiteral[]
}

interface EnumerationLiteral {
    name: string
}

type Member = AttributeMember | ReferenceMember

interface AttributeMember {
    name: string
    documentation?: Documentation
    ordered: boolean
    unique: boolean
    lowerBound?: number
    upperBound?: number
    bound: boolean
    type: AttributeType
    value?: Value
}

interface ReferenceMember {
    name: string
    documentation?: Documentation
    contains: boolean
    refers: boolean
    ordered: boolean
    unique: boolean
    lowerBound?: number
    upperBound?: number
    bound: boolean
    type: ReferenceType
}

type Type = AttributeType | ReferenceType
type AttributeType = IntegerType | FloatType | StringType | BooleanType | EnumerationType

interface ReferenceType {
    ref: @Entity
}

interface IntegerType {}
interface FloatType {}
interface StringType {}
interface BooleanType {}

interface EnumerationType {
    enumerationRef: @Enumeration
}

type Value = PrimitiveValue | ComplexValue
type PrimitiveValue = IntegerValue | FloatValue | BooleanValue | StringValue | EnumerationLiteralValue

interface IntegerValue {
    value: number
}

interface FloatValue {
    value: number
}

interface BooleanValue {
    value: boolean
}

interface StringValue {
    value: string
}

interface EnumerationLiteralValue {
    literalRef: @EnumerationLiteral
}

type ComplexValue = ArrayValue

interface ArrayValue {
    values: PrimitiveValue[]
}
