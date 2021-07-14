export const NodeTypes = {
    ROOT: 'ROOT',
    ELEMENT: 'ELEMENT',
    TEXT: 'TEXT',
    SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',
    INTERPOLATION: 'INTERPOLATION',
    ATTRIBUTE: 'ATTRIBUTE',
    DIRECTIVE: 'DIRECTIVE',
}

export const ConstantTypes = {
    NOT_CONSTANT: 'NOT_CONSTANT',
    // CAN_SKIP_PATCH:'CAN_SKIP_PATCH',
    // CAN_HOIST:'CAN_HOIST',
    CAN_STRINGIFY: 'CAN_STRINGIFY'
}

export const ElementTypes = {
    ELEMENT: 'ELEMENT',
    COMPONENT: 'COMPONENT',
    // SLOT: 'SLOT',
    // TEMPLATE: 'TEMPLATE'
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
