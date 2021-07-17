import { isString, isArray } from '../utils';
import { NodeTypes } from './ast'

export function generate(ast) {
    return traverseNode(ast);
}

function traverseNode(node) {
    switch (node.type) {
        case NodeTypes.ROOT:
            if (node.children.length > 1) {
                return traverseChildren(node.children)
            } else if (node.children.length === 1){
                return traverseNode(node.children[0])
            }
            break;
        case NodeTypes.ELEMENT:
            let result = traverseChildren(node.children);
            if (result) {
                return `h("${node.tag}", null, ${result})`
            }
            return `h("${node.tag}")`
        case NodeTypes.TEXT:
            return `h(TEXT, null, "${node.content}")`
        default:
            break;
    }
}

function traverseChildren(children) {
    if (!children.length){
        return;
    }
    if (children.length === 1) {
        const child = children[0];
        if (child.type === NodeTypes.TEXT) {
            return JSON.stringify(child.content);
        }
        if (child.type === NodeTypes.INTERPOLATION) {
            return child.content.content
        }
    }
    return `[${children.map(child => traverseNode(child)).join(', ')}]`
    // if (isArray(children)) {
    //     return `[${children.map(child => traverseNode(child))}]`
    // }
    // return JSON.stringify(children);
}
