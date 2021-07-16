import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformElement } from '../../transforms/transformElement'
import { transformIf } from '../../transforms/vIf'

import { CREATE_TEXT, CREATE_VNODE, RESOLVE_COMPONENT } from '../../runtimeHelpers'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT } from '../../runtimeHelpers'

import {
    createObjectProperty,
    ElementTypes
} from '../../ast'

function parseWithIfTransform(
    template,
    options = {},
    returnIndex = 0,
    childrenLen = 1
) {
    const ast = parse(template, options)
    transform(ast, {
        nodeTransforms: [transformIf, transformElement],
        ...options
    })
    if (!options.onError) {
        expect(ast.children.length).toBe(childrenLen)
        for (let i = 0; i < childrenLen; i++) {
            // expect(ast.children[i].type).toBe(NodeTypes.IF)
        }
    }
    return {
        root: ast,
        node: ast.children[returnIndex]
    }
}

describe('compiler: v-if', () => {
    describe('transform', () => {
        test('basic v-if', () => {
            const { node } = parseWithIfTransform(`<div v-if="ok"/>`)
            expect(node.type).toBe(NodeTypes.IF)
            expect(node.branches.length).toBe(1)
            expect((node.branches[0].condition).content).toBe(
                `ok`
            )
            expect(node.branches[0].children.length).toBe(1)
            expect(node.branches[0].children[0].type).toBe(NodeTypes.ELEMENT)
            expect((node.branches[0].children[0]).tag).toBe(`div`)
        })

        test('component v-if', () => {
            const { node } = parseWithIfTransform(`<Component v-if="ok"></Component>`)
            expect(node.type).toBe(NodeTypes.IF)
            expect(node.branches.length).toBe(1)
            expect((node.branches[0].children[0]).tag).toBe(
                `Component`
            )
            expect((node.branches[0].children[0]).tagType).toBe(
                ElementTypes.COMPONENT
            )
        })

        test('v-if + v-else', () => {
            const { node } = parseWithIfTransform(`<div v-if="ok"/><p v-else/>`)
            expect(node.type).toBe(NodeTypes.IF)
            expect(node.branches.length).toBe(2)

            const b1 = node.branches[0]
            expect((b1.condition).content).toBe(`ok`)
            expect(b1.children.length).toBe(1)
            expect(b1.children[0].type).toBe(NodeTypes.ELEMENT)
            expect((b1.children[0]).tag).toBe(`div`)

            const b2 = node.branches[1]
            expect(b2.condition).toBeUndefined()
            expect(b2.children.length).toBe(1)
            expect(b2.children[0].type).toBe(NodeTypes.ELEMENT)
            expect((b2.children[0]).tag).toBe(`p`)
        })

        test('v-if + v-else-if', () => {
            const { node } = parseWithIfTransform(
                `<div v-if="ok"/><p v-else-if="orNot"/>`
            )
            expect(node.type).toBe(NodeTypes.IF)
            expect(node.branches.length).toBe(2)

            const b1 = node.branches[0]
            expect((b1.condition).content).toBe(`ok`)
            expect(b1.children.length).toBe(1)
            expect(b1.children[0].type).toBe(NodeTypes.ELEMENT)
            expect((b1.children[0]).tag).toBe(`div`)

            const b2 = node.branches[1]
            expect((b2.condition).content).toBe(`orNot`)
            expect(b2.children.length).toBe(1)
            expect(b2.children[0].type).toBe(NodeTypes.ELEMENT)
            expect((b2.children[0]).tag).toBe(`p`)
        })

        test('v-if + v-else-if + v-else', () => {
            const { node } = parseWithIfTransform(
                `<div v-if="ok"/><p v-else-if="orNot"/><h1 v-else>fine</h1>`
            )
            expect(node.type).toBe(NodeTypes.IF)
            expect(node.branches.length).toBe(3)

            const b1 = node.branches[0]
            expect((b1.condition).content).toBe(`ok`)
            expect(b1.children.length).toBe(1)
            expect(b1.children[0].type).toBe(NodeTypes.ELEMENT)
            expect((b1.children[0]).tag).toBe(`div`)

            const b2 = node.branches[1]
            expect((b2.condition).content).toBe(`orNot`)
            expect(b2.children.length).toBe(1)
            expect(b2.children[0].type).toBe(NodeTypes.ELEMENT)
            expect((b2.children[0]).tag).toBe(`p`)

            const b3 = node.branches[2]
            expect(b3.condition).toBeUndefined()
            expect(b3.children.length).toBe(1)
            expect(b3.children[0].type).toBe(NodeTypes.ELEMENT)
            expect((b3.children[0].children[0]).content).toBe(`fine`)
        })
    })

    describe('codegen', () => {
        const emptyNode = 'to replace to empty text vnode'
        function assertSharedCodegen(node, depth = 0, hasElse = false) {
            expect(node).toMatchObject({
                type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
                test: {
                    content: `ok`
                },
                consequent: {
                    type: NodeTypes.VNODE_CALL,
                },
                alternate:
                    depth < 1
                        ? hasElse
                            ? {
                                type: NodeTypes.VNODE_CALL,
                            }
                            : emptyNode
                        : {
                            type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
                            test: {
                                content: `orNot`
                            },
                            consequent: {
                                type: NodeTypes.VNODE_CALL,
                            },
                            alternate: hasElse
                                ? {
                                    type: NodeTypes.VNODE_CALL,
                                }
                                : emptyNode
                        }
            })
        }

        test('basic v-if', () => {
            const {
                node: { codegenNode }
            } = parseWithIfTransform(`<div v-if="ok"/>`)
            assertSharedCodegen(codegenNode)
            expect(codegenNode.consequent).toMatchObject({
                tag: `"div"`,
            })
            expect(codegenNode.alternate).toEqual(emptyNode)
        })

        test('v-if + v-else', () => {
            const {
                root,
                node: { codegenNode }
            } = parseWithIfTransform(`<div v-if="ok"/><p v-else/>`)
            assertSharedCodegen(codegenNode, 0, true)
            expect(codegenNode.consequent).toMatchObject({
                tag: `"div"`,
            })
            expect(codegenNode.alternate).toMatchObject({
                tag: `"p"`,
            })
        })

        test('v-if + v-else-if', () => {
            const {
                root,
                node: { codegenNode }
            } = parseWithIfTransform(`<div v-if="ok"/><p v-else-if="orNot" />`)
            assertSharedCodegen(codegenNode, 1)
            expect(codegenNode.consequent).toMatchObject({
                tag: `"div"`,
            })
            const branch2 = codegenNode.alternate
            expect(branch2.consequent).toMatchObject({
                tag: `"p"`,
            })
        })

        test('with spaces between branches', () => {
            const {
                node: { codegenNode }
            } = parseWithIfTransform(
                `<div v-if="ok"/> <p v-else-if="no"/> <span v-else/>`
            )
            expect(codegenNode.consequent).toMatchObject({
                tag: `"div"`,
            })
            const branch = codegenNode.alternate
            expect(branch.consequent).toMatchObject({
                tag: `"p"`,
            })
            expect(branch.alternate).toMatchObject({
                tag: `"span"`,
            })
        })
    })
})
