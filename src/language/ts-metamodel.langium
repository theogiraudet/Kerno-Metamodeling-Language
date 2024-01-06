grammar TsMetamodel
import './ts-metamodel-types'

entry Model returns Model:
    // 'module' module=ID
    namespaces += Classifier*;

Classifier returns Classifier: Entity | Enumeration;

Entity returns Entity:
    documentation=Documentation? 'entity' name=ID '{' members += Member* '}';

Enumeration returns Enumeration:
    documentation=Documentation? 'enumeration' name=ID '{' literals += EnumerationLiteral (',' literals += EnumerationLiteral)* '}';

EnumerationLiteral returns EnumerationLiteral:
    name = ID;

Member returns Member:
     AttributeMember | ReferenceMember;

AttributeMember returns AttributeMember:
    documentation=Documentation? 'prop' name=ID ':' (
        ( ordered?='ordered' & unique?='unique') type=AttributeType Cardinality ('=' value=ComplexValue)? | 
        type=AttributeType ('=' value=PrimitiveValue)?
    );

ReferenceMember returns ReferenceMember:
    documentation=Documentation? (contains?="contains" | refers?="refers") name=ID ':' ((ordered?='ordered' & unique?='unique') type=ReferenceType  Cardinality? | type=ReferenceType);

fragment Cardinality:
    '[' (lowerBound=INT (bound?='..' upperBound=INT?)? | bound?='..' lowerBound=INT)  ']';

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
    literalRef=[EnumerationLiteral:ID];

ReferenceType returns ReferenceType:
    ref=[Entity:ID];

Documentation returns Documentation:
    'doc' text=STRING;

hidden terminal WS: /\s+/;
terminal ID: /\^?[_a-zA-Z][\w_]*/;
terminal FLOAT returns number: INT ('.' INT);
terminal INT returns number: /[0-9]+/;
terminal STRING returns string: /"[^\n\r"]*"/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
