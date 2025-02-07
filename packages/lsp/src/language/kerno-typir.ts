import { AstNode, LangiumSharedCoreServices, Module } from "langium";
import { AbstractLangiumTypeCreator, LangiumServicesForTypirBinding, PartialTypirLangiumServices } from "typir-langium";
import { CreateFieldDetails, InferenceRuleNotApplicable, TypirServices, ValidationMessageDetails } from 'typir';
import { isAttributeMember, isBooleanType, isBooleanValue, isContainsValue, isEntity, isEnumeration, isEnumerationLiteral, isEnumerationLiteralValue, isEnumerationType, isFloatType, isFloatValue, isInstanceAttributeMember, isIntegerType, isIntegerValue, isReferenceMember, isReferenceType, isStringType, isStringValue, ReferenceMember } from "./generated/ast.js";
import { languages } from "vscode";

export class KernoTypeCreator extends AbstractLangiumTypeCreator {
    
    protected readonly typir: TypirServices;

    constructor(typirServices: TypirServices, langiumServices: LangiumSharedCoreServices) {
        super(typirServices, langiumServices);
        this.typir = typirServices;
    }

    override onInitialize(): void {
        const integerType = this.typir.factory.Primitives.create({ primitiveName: 'integer', 
            inferenceRules: [ isIntegerValue, isIntegerType ]});
        const stringType = this.typir.factory.Primitives.create({ primitiveName: 'string', 
            inferenceRules: [ isStringValue, isStringType ]});
        const floatType = this.typir.factory.Primitives.create({ primitiveName: 'float', 
            inferenceRules: [ isFloatValue, isFloatType ]});
        const booleanType = this.typir.factory.Primitives.create({ primitiveName: 'boolean', 
            inferenceRules: [ isBooleanValue, isBooleanType]});
        const typeAny = this.typir.factory.Top.create({});
        const typeNone = this.typir.factory.Bottom.create({});


        this.typir.Inference.addInferenceRule(node => {
            if (isInstanceAttributeMember(node)) {
                return node.memberRef.ref?.memberType;
            } else if(isAttributeMember(node)) {
                return node.memberType;
            }
            return InferenceRuleNotApplicable;
        });

        this.typir.factory.Operators.createBinary({ name: '=', signature: { left: typeAny, right: typeAny, return: typeNone }, 
            inferenceRule: {
                filter: isAttributeMember,
                matching: (node, _opName) => node.value !== undefined,
                operands: (node, _opName) => [node, node.value]
                },
            validationRule: (node, _opName, _opType, typir) => typir.validation.Constraints.ensureNodeIsAssignable(node.value, node, (actual, expected) => <ValidationMessageDetails>{
                message: `The expression '${node.value?.$cstNode?.text}' of type '${actual.name}' is not assignable to attribute '${node.name}' with type '${expected.name}'`,
                languageProperty: 'value' }),
        });

        this.typir.factory.Operators.createBinary({ name: '=', signature: { left: typeAny, right: typeAny, return: typeNone }, 
            inferenceRule: {
                filter: isInstanceAttributeMember,
                matching: (node, _opName) => node.value !== undefined,
                operands: (node, _opName) => [node, node.value]
                },
            validationRule: (node, _opName, _opType, typir) => typir.validation.Constraints.ensureNodeIsAssignable(node.value, node, (actual, expected) => <ValidationMessageDetails>{
                message: `The expression '${node.value?.$cstNode?.text}' of type '${actual.name}' is not assignable to attribute '${node.memberRef.$refText}' with type '${expected.name}'`,
                languageProperty: 'value' }),
        });

    }

    override onNewAstNode(languageNode: AstNode): void {
        if(isEnumeration(languageNode)) {
            this.typir.factory.Primitives.create({ primitiveName: languageNode.name, inferenceRules: [ 
                node => isEnumerationType(node) && node.enumerationRef.ref === languageNode,
                node => isEnumerationLiteral(node) && node.$container === languageNode
            ]});
        }

        // if(isReferenceType(languageNode)) {
        //     this.typir.Inference.addInferenceRule(node => {
        //         if(isReferenceType(node)) {
        //             return node.ref.ref;
        //         }
        //         return InferenceRuleNotApplicable;
        //     });
        // }

        if(isEnumerationLiteralValue(languageNode)) {
            this.typir.Inference.addInferenceRule(node => {
                if(isEnumerationLiteralValue(node)) {
                    return node.literalRef.ref;
                }
                return InferenceRuleNotApplicable;
            });
        }

        if(isEntity(languageNode)) {
            const className = languageNode.name;
            const classType = this.typir.factory.Classes.create({
                className: className,
                fields: languageNode.members.map(f => <CreateFieldDetails>{
                    name: f.name,
                    type: f.memberType, // note that type inference is used here
                }),
                methods: [],
                inferenceRuleForDeclaration: (node: unknown) => node === languageNode,
                inferenceRuleForReference: { // <InferClassLiteral<TypeReference>>
                    filter: isReferenceMember,
                    matching: (node: ReferenceMember) => isEntity(node.memberType?.ref) && node.memberType!.ref.name === className,
                    inputValuesForFields: (_languageNode: ReferenceMember) => new Map(), // values for fields don't matter for nominal typing
                },
            });

        }

        if(isContainsValue(languageNode)) {
            this.typir.Inference.addInferenceRule(node => {
                if(isContainsValue(node)) {
                    return node.$container;
                }
                return InferenceRuleNotApplicable;
            });
        }
    }
}

export function createKernoTypirModule(langiumServices: LangiumSharedCoreServices): Module<LangiumServicesForTypirBinding, PartialTypirLangiumServices> {
    return {
        TypeCreator: (typirServices) => new KernoTypeCreator(typirServices, langiumServices),
    };
}