import type { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { type KernoAstType, isEnumerationLiteralValue, ArrayValue, Entity, Enumeration, Model, Member, AttributeMember, isAttributeType } from './generated/ast.js';
import type { KernoServices } from './kerno-module.js';
import { checkValueType } from './kerno-type-system.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: KernoServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.KernoValidator;
    const checks: ValidationChecks<KernoAstType> = {
        Member: validator.checkCardinality,
        AttributeMember: validator.checkAttributeTypeValue,
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
export class KernoValidator {

    /**
     * Check if the property names of an entity are unique.
     * @param entity the entity to check the properties of
     * @param accept the validation acceptor
     */
    checkPropertyNameUniqueness(entity: Entity, accept: ValidationAcceptor): void {
        this.checkUniqueness(entity.members, 'name', 'property', accept)
    }

    /**
     * Check if the entity names of a model is unique.
     * @param model the model to check the entities of
     * @param accept the validation acceptor
     */
    checkEntityNameUniqueness(model: Model, accept: ValidationAcceptor): void {
        this.checkUniqueness(model.namespaces, 'name', 'entity', accept)
    }

    /**
     * Check if the enumeration literal names are unique.
     * @param enumeration the enumeration to check the literals of
     * @param accept the validation acceptor
     */
    checkLiteralNameUniqueness(enumeration: Enumeration, accept: ValidationAcceptor): void {
        this.checkUniqueness(enumeration.literals, 'name', 'enumeration literal', accept)
    }

    
    /**
     * Check if the cardinality of a member is valid.
     * A cardinality is valid if the lower bound is less than or equal to the upper bound. 
     * If the lower (upper) bound is not specified, it is assumed to be 0 (Number.MAX_VALUE).
     * If the lower bound is 0 and the upper bound is 0, the cardinality is invalid.
     * @param member the member to check the cardinality of
     * @param accept the validation acceptor
     */
    checkCardinality(member: Member, accept: ValidationAcceptor): void {
        if ((member.lowerBound || 0) > (member.upperBound || Number.MAX_VALUE)) {
            accept('error', 'The minimum bound of a cardinality cannot be greater than the maximum bound.', { node: member, range: member.$cstNode?.range });
        } else if(member.lowerBound === 0 && member.upperBound === 0) {
            accept('error', "Cardinality 0 is meaningless", { node: member, range: member.$cstNode?.range });
        }
    }

    /**
     * Check if the value of an attribute is of the correct type, ie the specified type for the attribute.
     * @param member the attribute member to check the value of
     * @param accept the validation acceptor
     */
    checkAttributeTypeValue(member: AttributeMember, accept: ValidationAcceptor): void {
        const type = member.type;
        if(isAttributeType(type) && member.value) {
            if(!checkValueType(type, member.value)) {
                accept('error', `Value must be of type '${type.$type.slice(0, -'Type'.length).toLowerCase()}', found '${member.value.$type.slice(0, -'Value'.length).toLowerCase()}'.`, { node: member.value });
            }
        }
    }

    /**
     * Check if an array value is valid.
     * An array is valid if the size is between the lower and upper bound (inclusive) specified in the cardinality of the attribute.
     * If the lower (upper) bound is not specified, it is assumed to be 0 (Number.MAX_VALUE).
     * If the array is unique, it is checked if all elements are unique.
     * @param array the array to check the properties of
     * @param accept the validation acceptor
     */
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

    /**
     * Check if all the value of an array are unique according to a given property.
     * @param array the array to check the values of
     * @param propToCheck the property used to check the uniqueness of the values
     * @param elementNameString the name of the elements in the array, used only for the logs
     * @param accept the validation acceptor
     */
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
