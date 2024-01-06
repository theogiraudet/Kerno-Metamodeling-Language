import { type Entity, type Model, type Member, type Type, isReferenceType, isAttributeType } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import { CompositeGeneratorNode, NL, toString } from 'langium';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

generateEntity({$container: {$type: 'Model', namespaces: []}, $type: 'Entity', name: "", members: []}, undefined)

export function generateTypeScript(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.ts`;

    const fileNode = new CompositeGeneratorNode();
    fileNode.append('"use strict";', NL, NL);
    // model.greetings.forEach(greeting => fileNode.append(`console.log('Hello, ${greeting.person.ref?.name}!');`, NL));

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function generateEntity(entity: Entity, generatorNode?: CompositeGeneratorNode) {
    generatorNode = generatorNode as CompositeGeneratorNode
    generatorNode.append("type", entity.name, "{", NL)
    for(const prop of entity.members) {
        generatorNode.indent()
        generateProp(prop, generatorNode)
        generatorNode.appendNewLine()
    }
    generatorNode.appendNewLine()
}

function generateProp(prop: Member, generatorNode: CompositeGeneratorNode) {
    generatorNode.append(prop.name, ':')
    generateCompositeType(prop, generatorNode)
}

function generateCompositeType(prop: Member, generatorNode: CompositeGeneratorNode) {
    const multiple = prop.lowerBound !== undefined || prop.upperBound !== undefined
    generatorNode.appendIf(multiple && prop.ordered && prop.unique , 'OrderedSet<')
                 .appendIf(multiple && prop.ordered && !prop.unique, 'Array<')
                 .appendIf(multiple && !prop.ordered && prop.unique, 'Set<')
    generateType(prop.type, generatorNode)
    generatorNode.appendIf(multiple, ">")
}

function generateType(type: Type, generatorNode: CompositeGeneratorNode) {
    if(isAttributeType(type)) {
        generatorNode.append(type.$type)
    } else if(isReferenceType(type)) {
        generatorNode.append(type.ref.$refText)
    }
}

