import type { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { type TsMetamodelAstType, isPrimitiveType, isEnumerationLiteralValue, ArrayValue, Entity, Enumeration, Model, Member, AttributeMember, isPrimitiveValue, PrimitiveValue } from './generated/ast.js';
import type { TsMetamodelServices } from './ts-metamodel-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TsMetamodelServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TsMetamodelValidator;
    const checks: ValidationChecks<TsMetamodelAstType> = {
        Member: validator.checkCardinality,
        AttributeMember: validator.checkAttributeValue,
        ArrayValue: validator.checkArrayProperties,
        Entity: validator.checkPropertyNameUniqueness,
        Model: validator.checkEntityNameUniqueness,
        Enumeration: validator.checkLiteralNameUniqueness,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TsMetamodelValidator {

    checkPropertyNameUniqueness(entity: Entity, accept: ValidationAcceptor): void {
        this.checkUniqueness(entity.members, 'name', 'property', accept)
    }

    checkEntityNameUniqueness(model: Model, accept: ValidationAcceptor): void {
        this.checkUniqueness(model.namespaces, 'name', 'entity', accept)
    }

    checkLiteralNameUniqueness(enumeration: Enumeration, accept: ValidationAcceptor): void {
        this.checkUniqueness(enumeration.literals, 'name', 'enumeration literal', accept)
    }

    checkCardinality(member: Member, accept: ValidationAcceptor): void {
        if ((member.lowerBound || Number.MIN_VALUE) > (member.upperBound || Number.MAX_VALUE)) {
            accept('error', 'The minimum bound of a cardinality cannot be greater than the maximum bound.', { node: member, range: member.$cstNode?.range });
        } else if(member.lowerBound === 0 && member.upperBound === 0) {
            accept('error', "Cardinality 0 is meaningless", { node: member, range: member.$cstNode?.range });
        }
    }

    checkAttributeValue(member: AttributeMember, accept: ValidationAcceptor): void {
        const type = member.type;
        if(isPrimitiveType(type) && member.value) {
            const value = member.value;
            if(isPrimitiveValue(value)) {
               this.checkValueType(type.name, value!, accept);
            } else {
                value.values.forEach((simpleValue) => this.checkValueType(type.name, simpleValue, accept))
            }
        }
    }

    private checkValueType(expectedType: string, value: PrimitiveValue, accept: ValidationAcceptor) {
        let foundType: string = '';
            if(isPrimitiveValue(value) && !isEnumerationLiteralValue(value)) {
                foundType = value.$type.slice(0, -'Value'.length).toLowerCase()
            } else if(isEnumerationLiteralValue(value)) {
                foundType = value.literalRef.$refText
            }

            if(foundType !== expectedType) {
                accept('error', `Value must be of type '${expectedType}', found '${foundType}'.`, { node: value });
            }
    }

    checkArrayProperties(array: ArrayValue, accept: ValidationAcceptor): void {
        const container = array.$container
        const unique = container.unique
        const min = container.lowerBound || (!container.bound ? container.upperBound! : 0)
        const max = container.upperBound || (!container.bound ? container.lowerBound! : Number.MAX_VALUE)
        const size = array.values.length
        
        if(size < min) {
            accept('error', `Array must have at least ${min} element(s), ${size} found.`, { node: array });
        } else if(size > max) {
            accept('error', `Array must have at most ${max} element(s), ${size} found.`, { node: array });
        }

        if(unique) {
            const elements: any[] = []
            for(const element of array.values) {
                if(!isEnumerationLiteralValue(element)) {
                    if(elements.includes(element.value)) {
                        accept('error', `Array must only have unique values.`, { node: element });
                    }
                    elements.push(element.value)
                } else {
                    if(elements.includes(element.literalRef.ref!)) {
                        accept('error', `Array must only have unique values.`, { node: element });
                    }
                    elements.push(element.literalRef.ref!)
                }
            }
        }
    }

    checkUniqueness<T extends AstNode, U extends keyof T>(array: T[], propToCheck: U, elementNameString: string, accept: ValidationAcceptor): void {
        const elements: any[] = []
        for(const element of array) {
            if(elements.includes(element[propToCheck])) {
                accept('error', `A ${elementNameString} named '${element[propToCheck]}' already exist.`, { node: element });
            }
            elements.push(element[propToCheck])
        }
    }

}
