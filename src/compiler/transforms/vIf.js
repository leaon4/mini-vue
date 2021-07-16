import {
    NodeTypes,
    ElementTypes,
    createVNodeCall,
    createObjectProperty,
    createSimpleExpression,
    createObjectExpression,
    createConditionalExpression
} from '../ast'
import { createStructuralDirectiveTransform, traverseNode } from '../transform'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT, RESOLVE_COMPONENT } from '../runtimeHelpers'
import { CREATE_VNODE } from '../runtimeHelpers'

export const transformIf = createStructuralDirectiveTransform(
    /^(if|else|else-if)$/,
    (node, dir, context) => {
        return processIf(node, dir, context, (ifNode, branch, isRoot) => {
            // #1587: We need to dynamically increment the key based on the current
            // node's sibling nodes, since chained v-if/else branches are
            // rendered at the same depth
            const siblings = context.parent.children
            let i = siblings.indexOf(ifNode)
            let key = 0
            while (i-- >= 0) {
                const sibling = siblings[i]
                if (sibling && sibling.type === NodeTypes.IF) {
                    key += sibling.branches.length
                }
            }

            // Exit callback. Complete the codegenNode when all children have been
            // transformed.
            return () => {
                if (isRoot) {
                    ifNode.codegenNode = createCodegenNodeForBranch(
                        branch,
                        // key,
                        context
                    )
                } else {
                    // attach this branch's codegen node to the v-if root.
                    const parentCondition = getParentCondition(ifNode.codegenNode)
                    parentCondition.alternate = createCodegenNodeForBranch(
                        branch,
                        key + ifNode.branches.length - 1,
                        context
                    )
                }
            }
        })
    }
)

// target-agnostic transform used for both Client and SSR
export function processIf(
    node,
    dir,
    context,
    processCodegen
) {
    if (dir.name === 'if') {
        const branch = createIfBranch(node, dir)
        const ifNode = {
            type: NodeTypes.IF,
            branches: [branch]
        }
        context.replaceNode(ifNode)
        if (processCodegen) {
            return processCodegen(ifNode, branch, true)
        }
    } else {
        // locate the adjacent v-if
        const siblings = context.parent.children
        let i = siblings.indexOf(node)
        while (i-- >= -1) {
            const sibling = siblings[i]

            if (
                sibling &&
                sibling.type === NodeTypes.TEXT &&
                !sibling.content.trim().length
            ) {
                context.removeNode(sibling)
                continue
            }

            if (sibling && sibling.type === NodeTypes.IF) {
                // move the node to the if node's branches
                context.removeNode()
                const branch = createIfBranch(node, dir)

                sibling.branches.push(branch)
                const onExit = processCodegen && processCodegen(sibling, branch, false)
                // since the branch was removed, it will not be traversed.
                // make sure to traverse here.
                traverseNode(branch, context)
                // call on exit
                if (onExit) onExit()
                // make sure to reset currentNode after traversal to indicate this
                // node has been removed.
                context.currentNode = null
            }
            break
        }
    }
}

function createIfBranch(node, dir) {
    return {
        type: NodeTypes.IF_BRANCH,
        condition: dir.name === 'else' ? undefined : dir.exp,
        children: [node],
    }
}

function createCodegenNodeForBranch(branch, context) {
    if (branch.condition) {
        return createConditionalExpression(
            branch.condition,
            createChildrenCodegenNode(branch, context),
            // make sure to pass in asBlock: true so that the comment node call
            // closes the current block.
            'to replace to empty text vnode'
        )
    } else {
        return createChildrenCodegenNode(branch, context)
    }
}

function createChildrenCodegenNode(branch, context) {
    // const { helper } = context
    const { children } = branch
    const firstChild = children[0]

    const vnodeCall = (firstChild)
        .codegenNode

    return vnodeCall
    // 暂不考虑needFragmentWrapper
}

function getParentCondition(
    node
) {
    while (true) {
        if (node.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
            if (node.alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
                node = node.alternate
            } else {
                return node
            }
        } else if (node.type === NodeTypes.JS_CACHE_EXPRESSION) {
            node = node.value
        }
    }
}
