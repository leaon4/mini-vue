import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformElement } from '../../transforms/transformElement'
import { transformText } from '../../transforms/transformText'

import { CREATE_TEXT, CREATE_VNODE, RESOLVE_COMPONENT } from '../../runtimeHelpers'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT } from '../../runtimeHelpers'

import {
  createObjectProperty
} from '../../ast'

function parseWithElementTransform(template, options = {}) {
  // wrap raw template in an extra div so that it doesn't get turned into a
  // block as root node
  const ast = parse(`<div>${template}</div>`, options)
  transform(ast, {
    nodeTransforms: [transformElement, transformText],
    ...options
  })
  const codegenNode = ast.children[0].children[0]
    .codegenNode
  expect(codegenNode.type).toBe(NodeTypes.VNODE_CALL)
  return {
    root: ast,
    node: codegenNode
  }
}

describe('compiler: element transform', () => {
  test('single element', () => {
    const { root, node } = parseWithElementTransform(`<p/>`)

    expect(root.children[0].codegenNode).toMatchObject({
      directives: undefined,
      props: undefined,
      tag: '"div"',
      type: NodeTypes.VNODE_CALL
    })
    expect(node).toStrictEqual({
      children: undefined,
      directives: undefined,
      props: undefined,
      tag: '"p"',
      type: NodeTypes.VNODE_CALL
    })

    expect(root.helpers).toStrictEqual([CREATE_VNODE])
  })

  test('import + resolve component', () => {
    const { root } = parseWithElementTransform(`<Foo/>`)
    expect(root.helpers).toContain(RESOLVE_COMPONENT)
    expect(root.components).toContain(`Foo`)
  })

  test('static props', () => {
    const { node } = parseWithElementTransform(`<div id="foo" class="bar" />`)
    expect(node).toStrictEqual({
      children: undefined,
      directives: undefined,
      tag: '"div"',
      type: NodeTypes.VNODE_CALL,
      props: {
        type: NodeTypes.JS_OBJECT_EXPRESSION,
        properties: [
          {
            type: NodeTypes.JS_PROPERTY,
            key: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: 'id',
              isStatic: true,
            },
            value: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: 'foo',
              isStatic: true,
            }
          },
          {
            type: NodeTypes.JS_PROPERTY,
            key: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: 'class',
              isStatic: true,
            },
            value: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: 'bar',
              isStatic: true,
            }
          }
        ]
      },
    })
  })

  test('props + children', () => {
    const { node } = parseWithElementTransform(`<div id="foo"><span/></div>`)

    expect(node).toMatchObject({
      directives: undefined,
      tag: '"div"',
      type: NodeTypes.VNODE_CALL,
      props: {
        type: NodeTypes.JS_OBJECT_EXPRESSION,
        properties: [
          {
            type: NodeTypes.JS_PROPERTY,
            key: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: 'id',
              isStatic: true,
            },
            value: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: 'foo',
              isStatic: true,
            }
          }
        ]
      },
    });

    expect(node.children[0].codegenNode).toStrictEqual({
      directives: undefined,
      tag: '"span"',
      type: NodeTypes.VNODE_CALL,
      props: undefined,
      children: undefined
    })
  })

  test('0 placeholder for children with no props', () => {
    const { node } = parseWithElementTransform(`<div><span/></div>`)

    expect(node).toMatchObject({
      tag: `"div"`,
      props: undefined,
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'span',
          codegenNode: {
            type: NodeTypes.VNODE_CALL,
            tag: `"span"`
          }
        }
      ]
    })
  })

  // 可能不需要runtimeDirectives
  /* test('directiveTransforms', () => {
    let _dir
    const { node } = parseWithElementTransform(`<div v-foo:bar="hello" />`, {
      directiveTransforms: {
        foo(dir) {
          _dir = dir
          return {
            props: [createObjectProperty(dir.arg, dir.exp)]
          }
        }
      }
    })

    expect(node.props).toMatchObject({
      type: NodeTypes.JS_OBJECT_EXPRESSION,
      properties: [
        {
          type: NodeTypes.JS_PROPERTY,
          key: _dir.arg,
          value: _dir.exp
        }
      ]
    })
  }) */
})
