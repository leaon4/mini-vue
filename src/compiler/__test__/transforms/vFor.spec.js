import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformElement } from '../../transforms/transformElement'
import { transformIf } from '../../transforms/vIf'
import { transformBind } from '../../transforms/vBind'
import { transformFor } from '../../transforms/vFor'

import { CREATE_TEXT, CREATE_VNODE, RESOLVE_COMPONENT } from '../../runtimeHelpers'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT, RENDER_LIST } from '../../runtimeHelpers'

import {
    createObjectProperty,
    ElementTypes
} from '../../ast'

function parseWithForTransform(template, options = {}) {
    const ast = parse(template, options)
    transform(ast, {
        nodeTransforms: [
            transformIf,
            transformFor,
            transformElement
        ],
        directiveTransforms: {
            bind: transformBind
        },
        ...options
    })
    return {
        root: ast,
        node: ast.children[0]
    }
}

describe('compiler: v-for', () => {
    describe('transform', () => {
        test('number expression', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="index in 5" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).toBeUndefined()
            expect((forNode.valueAlias).content).toBe('index')
            expect((forNode.source).content).toBe('5')
        })

        test('number expression', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="index in 5" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).toBeUndefined()
            expect((forNode.valueAlias).content).toBe('index')
            expect((forNode.source).content).toBe('5')
        })

        test('object de-structured value', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="({ id, value }) in items" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).toBeUndefined()
            expect((forNode.valueAlias).content).toBe(
                '{ id, value }'
            )
            expect((forNode.source).content).toBe('items')
        })

        test('array de-structured value', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="([ id, value ]) in items" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).toBeUndefined()
            expect((forNode.valueAlias).content).toBe(
                '[ id, value ]'
            )
            expect((forNode.source).content).toBe('items')
        })

        test('value and key', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="(item, key) in items" />'
            )
            expect(forNode.keyAlias).not.toBeUndefined()
            expect((forNode.keyAlias).content).toBe('key')
            expect(forNode.objectIndexAlias).toBeUndefined()
            expect((forNode.valueAlias).content).toBe('item')
            expect((forNode.source).content).toBe('items')
        })

        test('value, key and index', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="(value, key, index) in items" />'
            )
            expect(forNode.keyAlias).not.toBeUndefined()
            expect((forNode.keyAlias).content).toBe('key')
            expect(forNode.objectIndexAlias).not.toBeUndefined()
            expect((forNode.objectIndexAlias).content).toBe(
                'index'
            )
            expect((forNode.valueAlias).content).toBe('value')
            expect((forNode.source).content).toBe('items')
        })

        test('skipped key', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="(value,,index) in items" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).not.toBeUndefined()
            expect((forNode.objectIndexAlias).content).toBe(
                'index'
            )
            expect((forNode.valueAlias).content).toBe('value')
            expect((forNode.source).content).toBe('items')
        })

        test('skipped value and key', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="(,,index) in items" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).not.toBeUndefined()
            expect((forNode.objectIndexAlias).content).toBe(
                'index'
            )
            expect(forNode.valueAlias).toBeUndefined()
            expect((forNode.source).content).toBe('items')
        })

        test('unbracketed value', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="item in items" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).toBeUndefined()
            expect((forNode.valueAlias).content).toBe('item')
            expect((forNode.source).content).toBe('items')
        })

        test('unbracketed value and key', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="item, key in items" />'
            )
            expect(forNode.keyAlias).not.toBeUndefined()
            expect((forNode.keyAlias).content).toBe('key')
            expect(forNode.objectIndexAlias).toBeUndefined()
            expect((forNode.valueAlias).content).toBe('item')
            expect((forNode.source).content).toBe('items')
        })

        test('unbracketed value, key and index', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="value, key, index in items" />'
            )
            expect(forNode.keyAlias).not.toBeUndefined()
            expect((forNode.keyAlias).content).toBe('key')
            expect(forNode.objectIndexAlias).not.toBeUndefined()
            expect((forNode.objectIndexAlias).content).toBe(
                'index'
            )
            expect((forNode.valueAlias).content).toBe('value')
            expect((forNode.source).content).toBe('items')
        })

        test('unbracketed skipped key', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for="value, , index in items" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).not.toBeUndefined()
            expect((forNode.objectIndexAlias).content).toBe(
                'index'
            )
            expect((forNode.valueAlias).content).toBe('value')
            expect((forNode.source).content).toBe('items')
        })

        test('unbracketed skipped value and key', () => {
            const { node: forNode } = parseWithForTransform(
                '<span v-for=", , index in items" />'
            )
            expect(forNode.keyAlias).toBeUndefined()
            expect(forNode.objectIndexAlias).not.toBeUndefined()
            expect((forNode.objectIndexAlias).content).toBe(
                'index'
            )
            expect(forNode.valueAlias).toBeUndefined()
            expect((forNode.source).content).toBe('items')
        })
    })

    describe('codegen', () => {
        function assertSharedCodegen(
            node,
            keyed = false,
            customReturn = false,
            disableTracking = true
        ) {
            expect(node).toMatchObject({
                type: NodeTypes.VNODE_CALL,
                tag: FRAGMENT,
                children: {
                    type: NodeTypes.JS_CALL_EXPRESSION,
                    callee: RENDER_LIST,
                    arguments: [
                        {}, // to be asserted by each test
                        {
                            type: NodeTypes.JS_FUNCTION_EXPRESSION,
                            returns: customReturn
                                ? {}
                                : {
                                    type: NodeTypes.VNODE_CALL,
                                }
                        }
                    ]
                }
            })
            const renderListArgs = node.children.arguments
            return {
                source: renderListArgs[0],
                params: (renderListArgs[1]).params,
                returns: (renderListArgs[1]).returns,
                innerVNodeCall: customReturn ? null : (renderListArgs[1]).returns
            }
        }

        test('basic v-for', () => {
            const {
                root,
                node: { codegenNode }
            } = parseWithForTransform('<span v-for="(item) in items" />')
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: `items` },
                params: [{ content: `item` }],
                innerVNodeCall: {
                    tag: `"span"`
                }
            })
        })

        test('value + key + index', () => {
            const {
                root,
                node: { codegenNode }
            } = parseWithForTransform('<span v-for="(item, key, index) in items" />')
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: `items` },
                params: [{ content: `item` }, { content: `key` }, { content: `index` }]
            })
        })

        test('skipped value', () => {
            const {
                root,
                node: { codegenNode }
            } = parseWithForTransform('<span v-for="(, key, index) in items" />')
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: `items` },
                params: [{ content: `_` }, { content: `key` }, { content: `index` }]
            })
        })

        test('skipped key', () => {
            const {
                root,
                node: { codegenNode }
            } = parseWithForTransform('<span v-for="(item,,index) in items" />')
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: `items` },
                params: [{ content: `item` }, { content: `__` }, { content: `index` }]
            })
        })

        test('skipped value & key', () => {
            const {
                root,
                node: { codegenNode }
            } = parseWithForTransform('<span v-for="(,,index) in items" />')
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: `items` },
                params: [{ content: `_` }, { content: `__` }, { content: `index` }]
            })
        })

        test('keyed v-for', () => {
            const leadingBracketRE = /^\[/
            const bracketsRE = /^\[|\]$/g
            function createObjectMatcher(obj) {
                return {
                    type: NodeTypes.JS_OBJECT_EXPRESSION,
                    properties: Object.keys(obj).map(key => ({
                        type: NodeTypes.JS_PROPERTY,
                        key: {
                            type: NodeTypes.SIMPLE_EXPRESSION,
                            content: key.replace(bracketsRE, ''),
                            isStatic: !leadingBracketRE.test(key)
                        },
                        value: typeof (obj[key]) === 'string'
                            ? {
                                type: NodeTypes.SIMPLE_EXPRESSION,
                                content: obj[key].replace(bracketsRE, ''),
                                isStatic: !leadingBracketRE.test(obj[key])
                            }
                            : obj[key]
                    }))
                }
            }

            const {
                root,
                node: { codegenNode }
            } = parseWithForTransform('<span v-for="(item) in items" :key="item" />')
            expect(assertSharedCodegen(codegenNode, true)).toMatchObject({
                source: { content: `items` },
                params: [{ content: `item` }],
                innerVNodeCall: {
                    tag: `"span"`,
                    props: createObjectMatcher({
                        key: `[item]`
                    })
                }
            })
        })

        test('v-if + v-for', () => {
            // skip
        })
    })
})
