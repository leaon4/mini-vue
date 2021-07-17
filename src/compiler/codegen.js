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
    let ifNode = pluckDirective(node.directives, 'if')
        || pluckDirective(node.directives, 'else-if');

    if (ifNode) {
        // 递归必须用resolveElementASTNode，因为一个元素可能有多个指令
        // 所以处理指令时，移除当下指令也是必须的
        const consequent = resolveElementASTNode(node, parent);
        let alternate;
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
                if (sibling.type === NodeTypes.ELEMENT) {
                    let elseNode = children[i];
                    if (pluckDirective(sibling.directives, 'else')) {
                        alternate = resolveElementASTNode(elseNode, parent);
                        children.splice(i, 1);
                    } else if (pluckDirective(sibling.directives, 'else-if', false)) {
                        alternate = resolveElementASTNode(elseNode, parent);
                        children.splice(i, 1);
                    }
                }
                break;
            }
        }
        const { exp } = ifNode;
        return `${exp.content} ? ${consequent} : ${alternate || createTextVNode('')}`
    }

    let forNode = pluckDirective(node.directives, 'for');
    if (forNode) {
        const { exp } = forNode;
        const [args, source] = exp.content.split(/\sin\s|\sof\s/);
        return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(node)}))`
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

// 可以不remove吗？不可以
function pluckDirective(directives, name, remove = true) {
    const index = directives.findIndex(dir => dir.name === name)
    const dir = directives[index];
    if (remove && index > -1) {
        directives.splice(index, 1);
    }
    return dir;
}

function createTextVNode(content) {
    return `h(Text, null, "${content}")`
}
