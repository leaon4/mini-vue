import { NodeTypes } from '.';
import { capitalize } from '../utils';
import { ElementTypes } from './ast';

export function generate(ast) {
  const returns = traverseNode(ast);
  const code = `
with(ctx){
  const { h, Text, Fragment, renderList, withModel, resolveComponent } = MiniVue;
  return ${returns}
}
`;
  return code;
}

export function traverseNode(node, parent) {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        return traverseNode(node.children[0], node);
      }
      const result = traverseChildren(node);
      return result;
    case NodeTypes.ELEMENT:
      return resolveElementASTNode(node, parent);
    case NodeTypes.INTERPOLATION:
      return createTextVNode(node.content);
    case NodeTypes.TEXT:
      return createTextVNode(node);
  }
}

function createTextVNode(node) {
  const child = createText(node);
  return `h(Text, null, ${child})`;
}

function createText({ isStatic = true, content = '' } = {}) {
  return isStatic ? JSON.stringify(content) : content;
}

// 专门处理特殊指令
function resolveElementASTNode(node, parent) {
  const ifNode =
    pluck(node.directives, 'if') || pluck(node.directives, 'else-if');
  if (ifNode) {
    let consequent = resolveElementASTNode(node, parent);
    let alternate;

    const { children } = parent;
    let i = children.findIndex((child) => child === node) + 1;

    for (; i < children.length; i++) {
      const sibling = children[i];
      if (sibling.type === NodeTypes.TEXT && !sibling.content.trim()) {
        children.splice(i, 1);
        i--;
        continue;
      }
      if (sibling.type === NodeTypes.ELEMENT) {
        if (
          pluck(sibling.directives, 'else') ||
          pluck(sibling.directives, 'else-if', false)
        ) {
          alternate = resolveElementASTNode(sibling, parent);
          children.splice(i, 1);
        }
      }
      break;
    }

    const { exp } = ifNode;
    return `${exp.content} ? ${consequent} : ${alternate || createTextVNode()}`;
  }

  const forNode = pluck(node.directives, 'for');
  if (forNode) {
    const { exp } = forNode;
    const [args, source] = exp.content.split(/\sin\s|\sof\s/);
    return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(
      node,
      parent
    )}))`;
  }
  return createElementVNode(node);
}

function createElementVNode(node) {
  const { children, tagType } = node;
  const tag =
    tagType === ElementTypes.ELEMENT
      ? `"${node.tag}"`
      : `resolveComponent("${node.tag}")`;

  const propArr = createPropArr(node);

  let propStr = propArr.length ? `{ ${propArr.join(', ')} }` : 'null';

  const vModel = pluck(node.directives, 'model');
  if (vModel) {
    const getter = `() => ${createText(vModel.exp)}`;
    const setter = `value => ${createText(vModel.exp)} = value`;
    propStr = `withModel(${tag}, ${propStr}, ${getter}, ${setter})`;
  }

  if (!children.length) {
    if (propStr === 'null') {
      return `h(${tag})`;
    }
    return `h(${tag}, ${propStr})`;
  }

  let childrenStr = traverseChildren(node);
  return `h(${tag}, ${propStr}, ${childrenStr})`;
}

function createPropArr(node) {
  const { props, directives } = node;
  return [
    ...props.map((prop) => `${prop.name}: ${createText(prop.value)}`),
    ...directives.map((dir) => {
      switch (dir.name) {
        case 'bind':
          return `${dir.arg.content}: ${createText(dir.exp)}`;
        case 'on':
          const eventName = `on${capitalize(dir.arg.content)}`;

          let exp = dir.exp.content;

          // 通过判断它是否是以括号结尾，并且不包含 "=>"
          if (/\([^)]*?\)$/.test(exp) && !exp.includes('=>')) {
            exp = `$event => (${exp})`;
          }

          return `${eventName}: ${exp}`;
        case 'html':
          return `innerHTML: ${createText(dir.exp)}`;
        default:
          return `${dir.name}: ${createText(dir.exp)}`;
      }
    }),
  ];
}

function traverseChildren(node) {
  const { children } = node;
  if (children.length === 1) {
    const child = children[0];
    if (child.type === NodeTypes.TEXT) {
      return createText(child);
    }
    if (child.type === NodeTypes.INTERPOLATION) {
      return createText(child.content);
    }
  }

  const results = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    results.push(traverseNode(child, node));
  }
  return `[${results.join(', ')}]`;
}

function pluck(directives, name, remove = true) {
  const index = directives.findIndex((dir) => dir.name === name);
  const dir = directives[index];
  if (index > -1 && remove) {
    directives.splice(index, 1);
  }
  return dir;
}
