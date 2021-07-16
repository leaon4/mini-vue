import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformElement } from '../../transforms/transformElement'
import { transformOn } from '../../transforms/vOn'

import { CREATE_TEXT, CREATE_VNODE, RESOLVE_COMPONENT } from '../../runtimeHelpers'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT } from '../../runtimeHelpers'

import {
    createObjectProperty
} from '../../ast'

function parseWithVOn(template, options = {}) {
    const ast = parse(template, options)
    transform(ast, {
        nodeTransforms: [transformElement],
        directiveTransforms: {
            on: transformOn
        },
        ...options
    })
    return {
        root: ast,
        node: ast.children[0]
    }
}

describe('compiler: transform v-on', () => {
    test('basic', () => {
        const { node } = parseWithVOn(`<div v-on:click="onClick"/>`)
        expect(node.codegenNode.props).toMatchObject({
            properties: [
                {
                    key: {
                        content: `onClick`,
                        isStatic: true,
                    },
                    value: {
                        content: `onClick`,
                        isStatic: false,
                    }
                }
            ]
        })
    })

    test('inline statement', () => {
        // 这里原本是COMPOUND_EXPRESSION，但改成了SIMPLE_EXPRESSION。不知道codegen里能不能处理
        const { node } = parseWithVOn(`<div @click="foo($event)"/>`)
        expect(node.codegenNode.props).toMatchObject({
            properties: [
                {
                    type: NodeTypes.JS_PROPERTY,
                    key: { content: `onClick` },
                    value: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: 'foo($event)',
                        isStatic: false
                    }
                }
            ]
        })
    })

    test('should NOT wrap as function if expression is already function expression', () => {
        const { node } = parseWithVOn(`<div @click="$event => foo($event)"/>`)
        expect(node.codegenNode.props).toMatchObject({
            properties: [
                {
                    key: { content: `onClick` },
                    value: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: `$event => foo($event)`
                    }
                }
            ]
        })
    })

    test('should NOT wrap as function if expression is already function expression (with newlines)', () => {
        const { node } = parseWithVOn(
            `<div @click="
      $event => {
        foo($event)
      }
    "/>`
        )
        expect(node.codegenNode.props).toMatchObject({
            properties: [
                {
                    key: { content: `onClick` },
                    value: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: `
      $event => {
        foo($event)
      }
    `
                    }
                }
            ]
        })
    })

    test('should NOT wrap as function if expression is already function expression (with newlines + function keyword)', () => {
        const { node } = parseWithVOn(
            `<div @click="
      function($event) {
        foo($event)
      }
    "/>`
        )
        expect(node.codegenNode.props).toMatchObject({
            properties: [
                {
                    key: { content: `onClick` },
                    value: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: `
      function($event) {
        foo($event)
      }
    `
                    }
                }
            ]
        })
    })
})
