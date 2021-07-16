import { isString } from '../utils'
import { CREATE_VNODE, WITH_DIRECTIVES } from './runtimeHelpers'

export const NodeTypes = {
    ROOT: 'ROOT',
    ELEMENT: 'ELEMENT',
    TEXT: 'TEXT',
    SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',
    INTERPOLATION: 'INTERPOLATION',
    ATTRIBUTE: 'ATTRIBUTE',
    DIRECTIVE: 'DIRECTIVE',

    // containers
    COMPOUND_EXPRESSION: 'COMPOUND_EXPRESSION',
    IF: 'IF',
    IF_BRANCH: 'IF_BRANCH',
    FOR: 'FOR',
    TEXT_CALL: 'TEXT_CALL',
    // codegen
    VNODE_CALL: 'VNODE_CALL',
    JS_CALL_EXPRESSION: 'JS_CALL_EXPRESSION',
    JS_OBJECT_EXPRESSION: 'JS_OBJECT_EXPRESSION',
    JS_PROPERTY: 'JS_PROPERTY',


    JS_ARRAY_EXPRESSION: 'JS_ARRAY_EXPRESSION',
    JS_FUNCTION_EXPRESSION: 'JS_FUNCTION_EXPRESSION',
    JS_CONDITIONAL_EXPRESSION: 'JS_CONDITIONAL_EXPRESSION',
    JS_CACHE_EXPRESSION: 'JS_CACHE_EXPRESSION',
}

export const ElementTypes = {
    ELEMENT: 'ELEMENT',
    COMPONENT: 'COMPONENT',
}

export function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        children,
        helpers: [],
        components: [],
        directives: [],
        hoists: [],
        imports: [],
        cached: 0,
        temps: 0,
        codegenNode: undefined,
    }
}


export function createVNodeCall(
    context,
    tag,
    props,
    children,
    directives,
) {
    if (context) {
        context.helper(CREATE_VNODE)
        if (directives) {
            context.helper(WITH_DIRECTIVES)
        }
    }

    return {
        type: NodeTypes.VNODE_CALL,
        tag,
        props,
        children,
        directives,
    }
}

export function createObjectProperty(key, value) {
    return {
        type: NodeTypes.JS_PROPERTY,
        key: isString(key) ? createSimpleExpression(key, true) : key,
        value
    }
}

export function createSimpleExpression(content, isStatic) {
    return {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic
    }
}

export function createObjectExpression(properties) {
    return {
        type: NodeTypes.JS_OBJECT_EXPRESSION,
        properties
    }
}

export function createConditionalExpression(test, consequent, alternate, newline = true) {
    return {
        type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
        test,
        consequent,
        alternate,
        newline,
    }
}

export function createFunctionExpression(params, returns, newline = false) {
    return {
        type: NodeTypes.JS_FUNCTION_EXPRESSION,
        params,
        returns,
        newline,
    }
}

export function createCallExpression(callee, args = []) {
    return {
        type: NodeTypes.JS_CALL_EXPRESSION,
        callee,
        arguments: args
    }
}
