import {
    NodeTypes,
    ElementTypes,
    createVNodeCall,
    createObjectProperty,
    createSimpleExpression,
    createObjectExpression,
    createConditionalExpression,
    createFunctionExpression,
    createCallExpression
} from '../ast'
import { createStructuralDirectiveTransform, traverseNode } from '../transform'
import { TO_DISPLAY_STRING, H, TEXT, FRAGMENT, RESOLVE_COMPONENT, RENDER_LIST } from '../runtimeHelpers'
import { CREATE_VNODE } from '../runtimeHelpers'


const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
// This regex doesn't cover the case if key or index aliases have destructuring,
// but those do not make sense in the first place, so this works in practice.
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g

export const transformFor = createStructuralDirectiveTransform(
    'for',
    (node, dir, context) => {
        const { helper } = context
        return processFor(node, dir, context, forNode => {
            // create the loop render function expression now, and add the
            // iterator on exit after all children have been traversed
            const renderExp = createCallExpression(helper(RENDER_LIST), [
                forNode.source
            ])
            const keyProp = findProp(node, `key`)
            const keyProperty = keyProp
                ? createObjectProperty(
                    `key`,
                    keyProp.type === NodeTypes.ATTRIBUTE
                        ? createSimpleExpression(keyProp.value.content, true)
                        : keyProp.exp
                )
                : null

            forNode.codegenNode = createVNodeCall(
                context,
                helper(FRAGMENT),
                undefined,
                renderExp
            )

            return () => {
                // finish the codegen now that all children have been traversed
                let childBlock
                const { children } = forNode

                const needFragmentWrapper =
                    children.length !== 1 || children[0].type !== NodeTypes.ELEMENT

                if (needFragmentWrapper) {
                    childBlock = createVNodeCall(
                        context,
                        helper(FRAGMENT),
                        keyProperty ? createObjectExpression([keyProperty]) : undefined,
                        node.children,
                    )
                } else {
                    childBlock = children[0].codegenNode;
                }

                renderExp.arguments.push(createFunctionExpression(
                    createForLoopParams(forNode.parseResult),
                    childBlock,
                    true /* force newline */
                ))
            }
        })
    }
)

function findProp(node, name) {
    return node.props.find(p => p.name === name)
}

export function createForLoopParams({ value, key, index }) {
    const params = []
    if (value) {
        params.push(value)
    }
    if (key) {
        if (!value) {
            params.push(createSimpleExpression(`_`, false))
        }
        params.push(key)
    }
    if (index) {
        if (!key) {
            if (!value) {
                params.push(createSimpleExpression(`_`, false))
            }
            params.push(createSimpleExpression(`__`, false))
        }
        params.push(index)
    }
    return params
}

export function processFor(node, dir, context, processCodegen) {
    const parseResult = parseForExpression(
        // can only be simple expression because vFor transform is applied
        // before expression transform.
        dir.exp,
        context
    )

    const { source, value, key, index } = parseResult

    const forNode = {
        type: NodeTypes.FOR,
        source,
        valueAlias: value,
        keyAlias: key,
        objectIndexAlias: index,
        parseResult,
        children: [node]
    }

    context.replaceNode(forNode)

    const onExit = processCodegen && processCodegen(forNode)

    return () => {
        if (onExit) onExit()
    }
}

export function parseForExpression(input, context) {
    const exp = input.content
    const inMatch = exp.match(forAliasRE)
    if (!inMatch) return

    const [, LHS, RHS] = inMatch

    const result = {
        source: createSimpleExpression(
            RHS.trim(),
            false
        ),
        value: undefined,
        key: undefined,
        index: undefined
    }

    let valueContent = LHS.trim()
        .replace(stripParensRE, '')
        .trim()
    const trimmedOffset = LHS.indexOf(valueContent)

    const iteratorMatch = valueContent.match(forIteratorRE)
    if (iteratorMatch) {
        valueContent = valueContent.replace(forIteratorRE, '').trim()

        const keyContent = iteratorMatch[1].trim()
        if (keyContent) {
            keyOffset = exp.indexOf(keyContent, trimmedOffset + valueContent.length)
            result.key = createSimpleExpression(keyContent, false)
        }

        if (iteratorMatch[2]) {
            const indexContent = iteratorMatch[2].trim()

            if (indexContent) {
                result.index = createSimpleExpression(
                    indexContent,
                    false
                )
            }
        }
    }

    if (valueContent) {
        result.value = createSimpleExpression(valueContent, false)
    }

    return result
}
