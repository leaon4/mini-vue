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

const fnExpRE = /^\s*([\w$_]+|\([^)]*?\))\s*=>|^\s*function(?:\s+[\w$]+)?\s*\(/

export const transformOn = (
    dir,
    node,
    context,
    augmentor
) => {
    const { arg } = dir

    let eventName
    // arg只支持静态的
    if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
        if (arg.isStatic) {
            const rawName = arg.content
            // for all event listeners, auto convert it to camelCase. See issue #2249
            eventName = createSimpleExpression(
                transformEventName(arg.content),
                true,
            )
        } else {
            throw 'error'
        }
    } else {
        throw 'error'
    }

    // handler processing
    let exp = dir.exp
    if (exp && !exp.content.trim()) {
        exp = undefined
    }

    // exp只支持在组件内部的

    let ret = {
        props: [
            createObjectProperty(
                eventName,
                exp || createSimpleExpression(`() => {}`, false)
            )
        ]
    }

    // 这是什么鬼?
    // apply extended compiler augmentor
    // if (augmentor) {
    //   ret = augmentor(ret)
    // }

    return ret
}

function transformEventName(name) {
    return `on${name[0].toUpperCase()}${name.slice(1)}`;
}
