import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformText } from '../../src/transforms/transformText'
import { transformElement } from '../../src/transforms/transformElement'

import { CREATE_TEXT } from '../../src/runtimeHelpers'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT } from '../../runtimeHelpers'

function transformWithTextOpt(template, options = {}) {
    const ast = parse(template)
    transform(ast, {
        nodeTransforms: [
            transformElement,
            transformText
        ],
        ...options
    })
    return ast
}

describe('compiler: transform text', () => {
    test('no consecutive textf', () => {
        const root = transformWithTextOpt(`foo`)
        expect(root.children[0]).toMatchObject({
            type: NodeTypes.INTERPOLATION,
            content: {
                content: `foo`
            }
        })
        expect(root.helpers.length).toBe(0);
    })

    test('no consecutive text', () => {
        const root = transformWithTextOpt(`{{ foo }}`)
        expect(root.children[0]).toMatchObject({
            type: NodeTypes.INTERPOLATION,
            content: {
                content: `foo`
            }
        })
        expect(root.helpers.length).toBe(1);
        expect(root.helpers[0]).toBe(TO_DISPLAY_STRING);
    })

    test('consecutive text', () => {
        const root = transformWithTextOpt(`{{ foo }} bar {{ baz }}`)
        expect(root.children.length).toBe(1)
        expect(root.children[0]).toMatchObject({
            type: NodeTypes.COMPOUND_EXPRESSION,
            children: [
                { type: NodeTypes.INTERPOLATION, content: { content: `foo` } },
                ` + `,
                { type: NodeTypes.TEXT, content: ` bar ` },
                ` + `,
                { type: NodeTypes.INTERPOLATION, content: { content: `baz` } }
            ]
        })
        expect(root.helpers.length).toBe(1);
        expect(root.helpers[0]).toBe(TO_DISPLAY_STRING);
    })

    test('consecutive text between elements', () => {
        const root = transformWithTextOpt(`<div/>{{ foo }} bar {{ baz }}<div/>`)
        expect(root.children.length).toBe(3)
        expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
        expect(root.children[1]).toMatchObject({
            // when mixed with elements, should convert it into a text node call
            type: NodeTypes.TEXT_CALL,
            codegenNode: {
                type: NodeTypes.JS_CALL_EXPRESSION,
                callee: CREATE_TEXT,
                arguments: [
                    {
                        type: NodeTypes.COMPOUND_EXPRESSION,
                        children: [
                            { type: NodeTypes.INTERPOLATION, content: { content: `foo` } },
                            ` + `,
                            { type: NodeTypes.TEXT, content: ` bar ` },
                            ` + `,
                            { type: NodeTypes.INTERPOLATION, content: { content: `baz` } }
                        ]
                    },
                ]
            }
        })
        expect(root.children[2].type).toBe(NodeTypes.ELEMENT)

        expect(root.helpers.length).toBe(4);
        expect(root.helpers).toEqual([TO_DISPLAY_STRING, H, TEXT, FRAGMENT])
    })

    test('text between elements (static)', () => {
        const root = transformWithTextOpt(`<div/>hello<div/>`)
        expect(root.children.length).toBe(3)
        expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
        expect(root.children[1]).toMatchObject({
            // when mixed with elements, should convert it into a text node call
            type: NodeTypes.TEXT_CALL,
            codegenNode: {
                type: NodeTypes.JS_CALL_EXPRESSION,
                callee: CREATE_TEXT,
                arguments: [
                    {
                        type: NodeTypes.TEXT,
                        content: `hello`
                    }
                    // should have no flag
                ]
            }
        })
        expect(root.children[2].type).toBe(NodeTypes.ELEMENT)

        expect(root.helpers.length).toBe(3);
        expect(root.helpers).toEqual([H, TEXT, FRAGMENT])
    })

    test('consecutive text mixed with elements', () => {
        const root = transformWithTextOpt(
            `<div/>{{ foo }} bar {{ baz }}<div/>hello<div/>`
        )
        expect(root.children.length).toBe(5)
        expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
        expect(root.children[1]).toMatchObject({
            type: NodeTypes.TEXT_CALL,
            codegenNode: {
                type: NodeTypes.JS_CALL_EXPRESSION,
                callee: CREATE_TEXT,
                arguments: [
                    {
                        type: NodeTypes.COMPOUND_EXPRESSION,
                        children: [
                            { type: NodeTypes.INTERPOLATION, content: { content: `foo` } },
                            ` + `,
                            { type: NodeTypes.TEXT, content: ` bar ` },
                            ` + `,
                            { type: NodeTypes.INTERPOLATION, content: { content: `baz` } }
                        ]
                    },
                ]
            }
        })
        expect(root.children[2].type).toBe(NodeTypes.ELEMENT)
        expect(root.children[3]).toMatchObject({
            type: NodeTypes.TEXT_CALL,
            codegenNode: {
                type: NodeTypes.JS_CALL_EXPRESSION,
                callee: CREATE_TEXT,
                arguments: [
                    {
                        type: NodeTypes.TEXT,
                        content: `hello`
                    }
                ]
            }
        })
        expect(root.children[4].type).toBe(NodeTypes.ELEMENT)

        expect(root.helpers.length).toBe(4);
        expect(root.helpers).toEqual([TO_DISPLAY_STRING, H, TEXT, FRAGMENT])
    })
})
