import { NodeTypes } from '.';
import { capitalize } from '../utils';

export function generate(ast) {
  const returns = traverseNode(ast);
  const code = `
with(ctx){
  const { h, Text, Fragment } = MiniVue;
  return ${returns}
}
`;
  return code;
}

function traverseNode(node) {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        return traverseNode(node.children[0]);
      }
      const result = traverseChildren(node);
      return result;
    case NodeTypes.ELEMENT:
      return createElementVNode(node);
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

function createElementVNode(node) {
  const { children } = node;
  const tag = JSON.stringify(node.tag);

  const propArr = createPropArr(node);

  const propStr = propArr.length ? `{ ${propArr.join(', ')} }` : 'null';

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
    results.push(traverseNode(child));
  }
  return `[${results.join(', ')}]`;
}
