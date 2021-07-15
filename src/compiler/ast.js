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
