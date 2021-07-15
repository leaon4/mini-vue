import { isArray } from '../utils'
import { NodeTypes } from './ast'
import {
    TO_DISPLAY_STRING
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
        // components: new Set(),
        // directives: new Set(),
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

export function transform(root, options) {
    const context = createTransformContext(root, options)
    traverseNode(root, context)

    if (!options.ssr) {
        createRootCodegen(root, context)
    }
    // finalize meta information
    root.helpers = [...context.helpers.keys()]
    root.components = [...context.components]
    root.directives = [...context.directives]
    root.imports = context.imports
    root.hoists = context.hoists
    root.temps = context.temps
    root.cached = context.cached
}

function traverseNode(node, context) {
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
            if (!context.ssr) {
                context.helper(TO_DISPLAY_STRING)
            }
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
