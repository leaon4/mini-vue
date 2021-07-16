import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformElement } from '../../transforms/transformElement'
import { transformBind } from '../../transforms/vBind'

import { CREATE_TEXT, CREATE_VNODE, RESOLVE_COMPONENT } from '../../runtimeHelpers'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT } from '../../runtimeHelpers'

import {
    createObjectProperty
} from '../../ast'

function parseWithVBind(template, options = {}) {
    const ast = parse(template)
    transform(ast, {
        nodeTransforms: [
            transformElement
        ],
        directiveTransforms: {
            bind: transformBind
        },
        ...options
    })
    return ast.children[0]
}

describe('compiler: transform v-bind', () => {
    test('basic', () => {
        const node = parseWithVBind(`<div v-bind:id="id"/>`)
        const props = node.codegenNode.props
        expect(props.properties[0]).toMatchObject({
            key: {
                content: `id`,
                isStatic: true,
            },
            value: {
                content: `id`,
                isStatic: false,
            }
        })
    })
})
