import {
    NodeTypes,
    ElementTypes,
    createVNodeCall,
    createObjectProperty,
    createSimpleExpression,
    createObjectExpression
} from '../ast'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT, RESOLVE_COMPONENT } from '../runtimeHelpers'
import { CREATE_VNODE } from '../runtimeHelpers'

// v-bind without arg is handled directly in ./transformElements.ts due to it affecting
// codegen for the entire props object. This transform here is only for v-bind
// *with* args.
export const transformBind = (dir, _node, context) => {
    const { exp } = dir
    const arg = dir.arg

    if (arg.type !== NodeTypes.SIMPLE_EXPRESSION) {
        arg.children.unshift(`(`)
        arg.children.push(`) || ""`)
    } else if (!arg.isStatic) {
        arg.content = `${arg.content} || ""`
    }

    return {
        props: [createObjectProperty(arg, exp)]
    }
}
