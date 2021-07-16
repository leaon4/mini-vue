import { isArray, isString } from '../utils'
import { NodeTypes, createVNodeCall } from './ast'
import {
    TO_DISPLAY_STRING,
    FRAGMENT
} from './runtimeHelpers'

function createTransformContext(root, {
    nodeTransforms = [],
    directiveTransforms = {},
}) {
    const context = {
        // options
        nodeTransforms,
        directiveTransforms,

        // state
        root,
        helpers: new Map(),
        components: new Set(),
        directives: new Set(),
        // hoists: [],
        // imports: [],
        // constantCache: new Map(),
        // temps: 0,
        // cached: 0,
        // identifiers: Object.create(null),
        // scopes: {
        //     vFor: 0,
        //     vSlot: 0,
        //     vPre: 0,
        //     vOnce: 0
        // },
        parent: null,
        currentNode: root,
        childIndex: 0,

        // methods
        helper(name) {
            const count = context.helpers.get(name) || 0
            context.helpers.set(name, count + 1)
            return name
        },
        removeHelper(name) {
            const count = context.helpers.get(name)
            if (count) {
                const currentCount = count - 1
                if (!currentCount) {
                    context.helpers.delete(name)
                } else {
                    context.helpers.set(name, currentCount)
                }
            }
        },
        helperString(name) {
            return `_${helperNameMap[context.helper(name)]}`
        },
        replaceNode(node) {
            context.parent.children[context.childIndex] = context.currentNode = node
        },
        removeNode(node) {
            const list = context.parent.children
            const removalIndex = node
                ? list.indexOf(node)
                : context.currentNode
                    ? context.childIndex
                    : -1
            if (!node || node === context.currentNode) {
                // current node removed
                context.currentNode = null
                context.onNodeRemoved()
            } else {
                // sibling node removed
                if (context.childIndex > removalIndex) {
                    context.childIndex--
                    context.onNodeRemoved()
                }
            }
            context.parent.children.splice(removalIndex, 1)
        },
        onNodeRemoved: () => { },
    }

    return context
}

function createRootCodegen(root, context) {
    const { children } = root
    if (children.length === 1) {
        const child = children[0]
        if (isSingleElementRoot(root, child) && child.codegenNode) {
            root.codegenNode = child.codegenNode
        } else {
            root.codegenNode = child
        }
    } else if (children.length > 1) {
        root.codegenNode = createVNodeCall(
            context,
            context.helper(FRAGMENT),
            undefined,
            root.children,
        )
    } else {
        // no children = noop. codegen will return null.
    }
}

export function isSingleElementRoot(root, child) {
    const { children } = root
    return (
        children.length === 1 &&
        child.type === NodeTypes.ELEMENT
    )
}

export function transform(root, options) {
    const context = createTransformContext(root, options)
    traverseNode(root, context)

    createRootCodegen(root, context)
    // finalize meta information
    root.helpers = [...context.helpers.keys()]
    root.components = [...context.components]
    root.directives = [...context.directives]
}

export function traverseNode(node, context) {
    context.currentNode = node
    // apply transform plugins
    const { nodeTransforms } = context
    const exitFns = []
    for (let i = 0; i < nodeTransforms.length; i++) {
        const onExit = nodeTransforms[i](node, context)
        if (onExit) {
            if (isArray(onExit)) {
                exitFns.push(...onExit)
            } else {
                exitFns.push(onExit)
            }
        }
        if (!context.currentNode) {
            // node was removed
            return
        } else {
            // node may have been replaced
            node = context.currentNode
        }
    }

    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            // no need to traverse, but we need to inject toString helper
            context.helper(TO_DISPLAY_STRING)
            break
        // for container types, further traverse downwards
        case NodeTypes.IF:
            for (let i = 0; i < node.branches.length; i++) {
                traverseNode(node.branches[i], context)
            }
            break
        case NodeTypes.IF_BRANCH:
        case NodeTypes.FOR:
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            traverseChildren(node, context)
            break
    }

    // exit transforms
    context.currentNode = node
    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}

export function traverseChildren(parent, context) {
    let i = 0
    const nodeRemoved = () => {
        i--
    }
    for (; i < parent.children.length; i++) {
        const child = parent.children[i]
        if (isString(child)) {
            console.warn('isString')
            continue
        }
        context.parent = parent
        context.childIndex = i
        context.onNodeRemoved = nodeRemoved
        traverseNode(child, context)
    }
}

export function createStructuralDirectiveTransform(name, fn) {
    const matches = isString(name)
        ? (n) => n === name
        : (n) => name.test(n)

    return (node, context) => {
        if (node.type === NodeTypes.ELEMENT) {
            const { props } = node
            for (let i = 0; i < props.length; i++) {
                const prop = props[i]
                if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
                    props.splice(i, 1)
                    i--
                    return fn(node, prop, context)
                }
            }
        }
    }
}
