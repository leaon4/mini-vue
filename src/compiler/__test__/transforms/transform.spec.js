import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformText } from '../../transforms/transformText'
import { transformElement } from '../../transforms/transformElement'

import { CREATE_TEXT, CREATE_VNODE } from '../../runtimeHelpers'
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
    test('simple text', () => {
        const root = transformWithTextOpt(`foo`)
        expect(root.children[0]).toMatchObject({
            type: NodeTypes.TEXT,
            content: `foo`
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
        expect(root.children.length).toBe(3)
        expect(root.children).toStrictEqual([
            {
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: 'foo',
                    isStatic: false,
                }
            },
            {
                type: NodeTypes.TEXT,
                content: ' bar '
            },
            {
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: 'baz',
                    isStatic: false,
                }
            },
        ])

        expect(root.helpers.length).toBe(3);
        root.helpers.forEach(h => {
            expect([CREATE_VNODE, TO_DISPLAY_STRING, FRAGMENT]).toContain(h)
        })
    })

    test('consecutive text between elements', () => {
        const root = transformWithTextOpt(`<div/>{{ foo }} bar {{ baz }}<div/>`)
        expect(root.children.length).toBe(5)
        const types = root.children.map(child => child.type)
        expect(types).toStrictEqual([
            NodeTypes.ELEMENT,
            NodeTypes.INTERPOLATION,
            NodeTypes.TEXT,
            NodeTypes.INTERPOLATION,
            NodeTypes.ELEMENT
        ]);

        expect(root.helpers.length).toBe(3);
        root.helpers.forEach(h => {
            expect([CREATE_VNODE, TO_DISPLAY_STRING, FRAGMENT]).toContain(h)
        })
    })

    test('text between elements (static)', () => {
        const root = transformWithTextOpt(`<div/>hello<div/>`)
        expect(root.children.length).toBe(3)
        expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
        expect(root.children[1]).toMatchObject({
            type: NodeTypes.TEXT,
            content: `hello`
        })
        expect(root.children[2].type).toBe(NodeTypes.ELEMENT)

        expect(root.helpers.length).toBe(2);
        root.helpers.forEach(h => {
            expect([CREATE_VNODE, FRAGMENT]).toContain(h)
        })
    })

    test('consecutive text mixed with elements', () => {
        const root = transformWithTextOpt(
            `<div/>{{ foo }} bar {{ baz }}<div/>hello<div/>`
        )
        expect(root.children.length).toBe(7)
        const types=root.children.map(child=>child.type)
        expect(types).toStrictEqual([
            NodeTypes.ELEMENT,
            NodeTypes.INTERPOLATION,
            NodeTypes.TEXT,
            NodeTypes.INTERPOLATION,
            NodeTypes.ELEMENT,
            NodeTypes.TEXT,
            NodeTypes.ELEMENT,
        ])

        expect(root.helpers.length).toBe(3);
        root.helpers.forEach(h => {
            expect([CREATE_VNODE, TO_DISPLAY_STRING, FRAGMENT]).toContain(h)
        })
    })
})
