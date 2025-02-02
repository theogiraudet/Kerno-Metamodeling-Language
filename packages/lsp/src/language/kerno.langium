grammar Kerno
import './kerno.types'

entry Model returns Module:
    'module' name=QualifiedName
    imports += Import*
    namespaces += Classifier*;

Import returns Import:
    'import' '{' (imported += ClassifierImport (',' imported += ClassifierImport)*) '}' 'from' fromModule=[Module:QualifiedName];

ClassifierImport returns ClassifierImport:
    imported=[Classifier:ID] ('as' alias=ID)?;

Classifier returns Classifier: Entity | Enumeration | Instance;

Entity returns Entity:
    documentation=Documentation? 'entity' name=ID '(' id=ID ')' '{' members += Member* '}';

Enumeration returns Enumeration:
    documentation=Documentation? 'enumeration' name=ID '{' literals += EnumerationLiteral (',' literals += EnumerationLiteral)* '}';

Instance returns Instance:
    documentation=Documentation? entityRef=[Entity:ID] name=ID '{' members += InstanceMember* '}';

EnumerationLiteral returns EnumerationLiteral:
    name = ID;

Member returns Member:
     AttributeMember | ReferenceMember;

InstanceMember returns InstanceMember:
    InstanceAttributeMember | InstanceContainsMember | InstanceReferenceMember;

AttributeMember returns AttributeMember:
    documentation=Documentation? 'prop' name=ID ':' (
        ( ordered?='ordered' & unique?='unique') memberType=AttributeType Cardinality ('=' value=ComplexValue)? | 
        memberType=AttributeType ('=' value=PrimitiveValue)?
    );

InstanceAttributeMember returns InstanceAttributeMember:
    documentation=Documentation? 'prop' memberRef=[AttributeMember:ID] '=' value=(PrimitiveValue | ComplexValue);

InstanceContainsMember returns InstanceContainsMember:
    documentation=Documentation? 'contains' memberRef=[ReferenceMember:ID] '=' value=(ContainsValue)?;

InstanceReferenceMember returns InstanceReferenceMember:
    documentation=Documentation? 'refers' memberRef=[ReferenceMember:ID] '=' value=(ReferenceValue)?;

ContainsValue returns ContainsValue:
    memberRef=[Entity:ID] '{' values+=InstanceMember* '}';

ReferenceValue returns ReferenceValue:
    value=[Instance:ID];

ReferenceMember returns ReferenceMember:
    documentation=Documentation? (contains?="contains" | refers?="refers") name=ID ':' ((ordered?='ordered' & unique?='unique') memberType=ReferenceType  Cardinality? | memberType=ReferenceType);

fragment Cardinality:
    bound?='[' (lowerBound=INT ('..' upperBound=INT?)? | '..' lowerBound=INT)  ']';

AttributeType returns AttributeType: 
    {IntegerType} 'integer' | {FloatType} 'float' | {StringType} 'string' | {BooleanType} 'boolean' | EnumerationType;

EnumerationType returns EnumerationType: 
    enumerationRef=[Enumeration:ID];
      
ComplexValue returns ComplexValue:
    ArrayValue;

ArrayValue returns ArrayValue:
    '[' (values+=PrimitiveValue (',' values+=PrimitiveValue)*)? ']';

PrimitiveValue returns PrimitiveValue:
    FloatValue | IntegerValue | BooleanValue | StringValue | EnumerationLiteralValue;

IntegerValue returns IntegerValue:
    value=INT;

FloatValue returns FloatValue:
    value=FLOAT;

BooleanValue returns BooleanValue:
    value?='true' | 'false';

StringValue returns StringValue:
    value=STRING;

EnumerationLiteralValue returns EnumerationLiteralValue:
    literalRef=[EnumerationLiteral:QualifiedName];

ReferenceType returns ReferenceType:
    ref=[Entity:ID];

Documentation returns Documentation:
    'doc' text=DOC;

QualifiedName returns string:
    ID ('.' ID)*;

hidden terminal WS: /\s+/;
terminal ID: /\^?[_a-zA-Z][\w_]*/;
terminal FLOAT returns number: INT ('.' INT);
terminal INT returns number: /[0-9]+/;
terminal STRING returns string: /"[^\n\r"]*"/;
terminal DOC: /\/\*\*[\s\S]*?\*\//;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
