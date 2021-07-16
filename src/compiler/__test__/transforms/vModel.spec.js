import { baseParse as parse, NodeTypes, transform } from '../../index'
import { transformElement } from '../../transforms/transformElement'
import { transformOn } from '../../transforms/vOn'

import { CREATE_TEXT, CREATE_VNODE, RESOLVE_COMPONENT } from '../../runtimeHelpers'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT } from '../../runtimeHelpers'

import {
    createObjectProperty
} from '../../ast'

function parseWithVModel(template, options = {}) {
    const ast = parse(template)

    transform(ast, {
        nodeTransforms: [
            // transformFor,
            transformElement,
        ],
        directiveTransforms: {
            ...options.directiveTransforms,
            model: transformModel
        },
        ...options
    })

    return ast
}

describe('compiler: transform v-model', () => {
    test('simple expression', () => {
        // const root = parseWithVModel('<input v-model="model" />')
        // const node = root.children[0]
        // const props = node.codegenNode.props
        //   .properties

        // expect(props[0]).toMatchObject({
        //   key: {
        //     content: 'modelValue',
        //     isStatic: true
        //   },
        //   value: {
        //     content: 'model',
        //     isStatic: false
        //   }
        // })
    })
})
