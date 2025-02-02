interface Documentation {
    text: string
}

interface Documentable {
    documentation?: Documentation
}

interface Module {
    name: string
    imports: Import[]
    namespaces: Classifier[]
}

interface Import {
    fromModule: @Module
    imported: ClassifierImport[]
}

interface ClassifierImport {
    imported: @Classifier
    alias?: string
}

type NamedElement = Classifier | EnumerationLiteral
type Classifier = Entity | Enumeration | Instance

interface Entity extends Documentable {
    name: string
    id: string
    members: Member[]
}

interface Enumeration extends Documentable {
    name: string
    literals: EnumerationLiteral[]
}

interface Instance extends Documentable {
    name: string
    entityRef: @Entity
    members: InstanceMember[]
}

interface EnumerationLiteral {
    name: string
}

type Member = AttributeMember | ReferenceMember

type InstanceMember = InstanceAttributeMember | InstanceObjectMember

interface AttributeMember extends Documentable {
    name: string
    ordered: boolean
    unique: boolean
    lowerBound?: number
    upperBound?: number
    bound: boolean
    memberType: AttributeType
    value?: Value
}

interface ReferenceMember extends Documentable {
    name: string
    contains: boolean
    refers: boolean
    ordered: boolean
    unique: boolean
    lowerBound?: number
    upperBound?: number
    bound: boolean
    memberType: ReferenceType
    value?: Value
}

interface InstanceAttributeMember extends Documentable {
    value?: Value
    memberRef: @AttributeMember
}

type InstanceObjectMember = InstanceReferenceMember | InstanceContainsMember

interface InstanceReferenceMember extends Documentable {
    value?: ReferenceValue
    memberRef: @ReferenceMember
}

interface InstanceContainsMember extends Documentable {
    value?: ContainsValue
    memberRef: @ReferenceMember
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

type ObjectValue = ReferenceValue | ContainsValue

interface ReferenceValue {
    value: @Instance
}

interface ContainsValue {
    memberRef: @Entity
    values: InstanceMember[]
}
