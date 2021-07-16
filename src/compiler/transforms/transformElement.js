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

export const transformElement = (node, context) => {
    // perform the work on exit, after all child expressions have been
    // processed and merged.
    return function postTransformElement() {
        node = context.currentNode
        const { type } = node;
        if (type !== NodeTypes.ELEMENT) {
            return
        }

        const { tag, props } = node
        const isComponent = node.tagType === ElementTypes.COMPONENT

        // The goal of the transform is to create a codegenNode implementing the
        // VNodeCall interface.
        let vnodeTag = isComponent
            ? resolveComponentType(node, context)
            : `"${tag}"`

        let vnodeProps
        let vnodeChildren
        let dynamicPropNames
        let vnodeDirectives

        // props
        if (props && props.length > 0) {
            const propsBuildResult = buildProps(node, context)
            vnodeProps = propsBuildResult.props
            dynamicPropNames = propsBuildResult.dynamicPropNames
            const directives = propsBuildResult.directives
            vnodeDirectives =
                directives && directives.length
                    ? (createArrayExpression(
                        directives.map(dir => buildDirectiveArgs(dir, context))
                    ))
                    : undefined
        }

        // children
        if (node.children.length > 0) {
            if (node.children.length === 1
                && type === NodeTypes.INTERPOLATION
                && type === NodeTypes.TEXT) {
                vnodeChildren = child
            } else {
                vnodeChildren = node.children
            }
        }

        node.codegenNode = createVNodeCall(
            context,
            vnodeTag,
            vnodeProps,
            vnodeChildren,
            vnodeDirectives,
        )
    }
}

export function resolveComponentType(node, context) {
    let { tag } = node

    context.helper(RESOLVE_COMPONENT)
    context.components.add(tag)
    return toValidAssetId(tag, `component`)
}

export function toValidAssetId(name, type) {
    return `_${type}_${name.replace(/[^\w]/g, '_')}`
}

export function buildProps(node, context, props = node.props) {
    let properties = []
    const runtimeDirectives = []

    for (let i = 0; i < props.length; i++) {
        // static attribute
        const prop = props[i]
        if (prop.type === NodeTypes.ATTRIBUTE) {
            const { name, value } = prop
            let isStatic = true
            properties.push(
                createObjectProperty(
                    createSimpleExpression(
                        name,
                        true,
                    ),
                    createSimpleExpression(
                        value ? value.content : '',
                        isStatic,
                    )
                )
            )
        } else {
            // directives
            // 可能不需要runtimeDirectives
            const { name } = prop

            const directiveTransform = context.directiveTransforms[name]
            if (directiveTransform) {
                // has built-in directive transform.
                const { props, needRuntime } = directiveTransform(prop, node, context)
                properties.push(...props)
                if (needRuntime) {
                    runtimeDirectives.push(prop)
                    if (isSymbol(needRuntime)) {
                        directiveImportMap.set(prop, needRuntime)
                    }
                }
            } else {
                // no built-in transform, this is a user custom directive.
                runtimeDirectives.push(prop)
            }
        }
    }

    let propsExpression

    if (properties.length) {
        propsExpression = createObjectExpression(properties)
    }

    return {
        props: propsExpression,
        directives: runtimeDirectives, // 可能不需要runtimeDirectives
    }
}
