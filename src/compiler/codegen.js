import { isString, isArray } from '../utils';
import { NodeTypes } from './ast'

export function generate(ast) {
    return traverseNode(ast);
}

let count = 0;
function traverseNode(node, parent) {
    count++;
    if (count > 100) {
        throw count;
    }
    switch (node.type) {
        case NodeTypes.ROOT:
            if (node.children.length > 1) {
                return traverseChildren(node)
            } else if (node.children.length === 1) {
                return traverseNode(node.children[0], node)
            }
            break;
        case NodeTypes.ELEMENT:
            return resolveElementASTNode(node, parent);
        case NodeTypes.TEXT:
            return createTextVNode(node.content);
        default:
            break;
    }
}

function traverseChildren(node) {
    const { children } = node;
    if (!children.length) {
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

    let results = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        results.push(traverseNode(child, node));
    }

    return `[${results.join(', ')}]`
}

function resolveElementASTNode(node, parent) {
    let ifNode = hasVIf(node.directives);

    if (ifNode) {
        let elseNode;
        if (parent) {
            const { children } = parent;
            let i = children.findIndex(child => child === node) + 1;
            for (; i < children.length; i++) {
                const sibling = children[i];
                if (sibling.type === NodeTypes.TEXT && !sibling.content.trim().length) {
                    children.splice(i, 1);
                    i--;
                    continue;
                }
                if (sibling.type !== NodeTypes.ELEMENT || !pluckElse(sibling.directives)) {
                    break;
                }
                elseNode = children[i];
                children.splice(i, 1);
            }
        }
        const { exp } = ifNode;
        return `${exp.content} ? ${resolveElement(node)} : ${elseNode
            ? resolveElement(elseNode) : createTextVNode('')}`
    }
    return resolveElement(node);
}

function resolveElement(node) {
    let result = traverseChildren(node);
    if (result) {
        return `h("${node.tag}", null, ${result})`
    }
    return `h("${node.tag}")`
}

function hasVIf(directives) {
    let index = directives.findIndex(dir => dir.name === 'if')
    const node = directives[index];
    if (index > -1) {
        directives.splice(index, 1);
    }
    return node;
}

function pluckElse(directives) {
    let index = directives.findIndex(dir => dir.name === 'else')
    const node = directives[index];
    if (index > -1) {
        directives.splice(index, 1);
    }
    return node;
}

function createTextVNode(content) {
    return `h(TEXT, null, "${content}")`
}
