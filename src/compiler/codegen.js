import { isString, isArray } from '../utils';
import { ElementTypes, NodeTypes } from './ast'

export function generate(ast) {
    const returns = traverseNode(ast);
    const code = `
with (ctx) {
    const { h, Text, Fragment, renderList, resolveComponent, withModel } = MiniVue
    return ${returns}
}`
    return code;
}

export function generateReturns(ast) {
    return traverseNode(ast);
}

function traverseNode(node, parent) {
    switch (node.type) {
        case NodeTypes.ROOT:
            if (node.children.length > 1) {
                let result = traverseChildren(node)
                if (node.children.length > 1) {
                    return `[${result}]`
                }
                return result;
            } else if (node.children.length === 1) {
                return traverseNode(node.children[0], node)
            }
            break;
        case NodeTypes.ELEMENT:
            return resolveElementASTNode(node, parent);
        case NodeTypes.TEXT:
            return createTextVNode(node);
        case NodeTypes.INTERPOLATION:
            return createTextVNode(node.content);
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
            // isStatic = true，静态加引号
            return JSON.stringify(child.content);
        }
        if (child.type === NodeTypes.INTERPOLATION) {
            // isStatic = false，动态不加引号
            return child.content.content
        }
    }

    let results = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        results.push(traverseNode(child, node));
    }

    return results.join(', ')
}

function resolveElementASTNode(node, parent) {
    let ifNode = pluck(node.directives, 'if')
        || pluck(node.directives, 'else-if');

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
                    if (pluck(sibling.directives, 'else')) {
                        alternate = resolveElementASTNode(elseNode, parent);
                        children.splice(i, 1);
                    } else if (pluck(sibling.directives, 'else-if', false)) {
                        alternate = resolveElementASTNode(elseNode, parent);
                        children.splice(i, 1);
                    }
                }
                break;
            }
        }
        const { exp } = ifNode;
        return `${exp.content} ? ${consequent} : ${alternate || createTextVNode()}`
    }

    let forNode = pluck(node.directives, 'for');
    if (forNode) {
        const { exp } = forNode;
        const [args, source] = exp.content.split(/\sin\s|\sof\s/);
        return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(node)}))`
    }

    return resolveElement(node);
}

function resolveElement(node) {
    const { children, props, directives } = node

    const tag = node.tagType === ElementTypes.ELEMENT
        ? `"${node.tag}"`
        : `resolveComponent("${node.tag}")`;

    const vModel = pluck(directives, 'model');

    const propArr = [
        ...props.map(prop => {
            return `${prop.name}: ${createText(prop.value)}`
        }),
        ...directives.map(dir => {
            const content = dir.arg?.content;
            switch (dir.name) {
                case 'bind':
                    return `${content}: ${createText(dir.exp)}`
                case 'on':
                    const eventName = `on${content[0].toUpperCase()}${content.slice(1)}`;
                    let exp = dir.exp.content;

                    // 以括号结尾，并且不含'=>'的情况，如 @click="foo()"
                    // 当然，判断很不严谨
                    if (/\([^\)]*?\)$/.test(exp) && !exp.includes('=>')) {
                        exp = `$event => (${exp})`
                    }
                    return `${eventName}: ${exp}`;
                case 'html':
                    return `innerHTML: ${createText(dir.exp)}`
                default:
                    return `${dir.name}: ${createText(dir.exp)}`
            }
        })
    ];

    let propStr = propArr.length
        ? `{ ${propArr.join(', ')} }`
        : 'null';

    if (vModel) {
        const getter = `() => ${createText(vModel.exp)}`;
        const setter = `value => ${createText(vModel.exp)} = value`;
        propStr = `withModel(${tag}, ${propStr}, ${getter}, ${setter})`
    }

    if (!children.length) {
        if (propStr === 'null') {
            return `h(${tag})`;
        }
        return `h(${tag}, ${propStr})`
    }

    let childrenStr = traverseChildren(node);
    if (children.length > 1 || children[0].type === NodeTypes.ELEMENT) {
        childrenStr = `[${childrenStr}]`
    }
    return `h(${tag}, ${propStr}, ${childrenStr})`
}

// 可以不remove吗？不可以
function pluck(directives, name, remove = true) {
    const index = directives.findIndex(dir => dir.name === name)
    const dir = directives[index];
    if (remove && index > -1) {
        directives.splice(index, 1);
    }
    return dir;
}

// node只接收text和simpleExpresstion
function createTextVNode(node) {
    let child = createText(node)
    return `h(Text, null, ${child})`
}

function createText({ content = '', isStatic = true } = {}) {
    return isStatic
        ? JSON.stringify(content)
        : content
}
