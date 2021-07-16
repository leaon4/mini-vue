// vModel需要复合表达式，不知道能不能实现，暂停吧
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

export const transformModel = (dir, node, context) => {
    const { exp, arg } = dir

    const propName = arg ? arg : createSimpleExpression('modelValue', true)
    const eventName = arg
        ? isStaticExp(arg)
            ? `onUpdate:${arg.content}`
            : createCompoundExpression(['"onUpdate:" + ', arg])
        : `onUpdate:modelValue`

    let assignmentExp
    const eventArg = `$event`

    assignmentExp = createCompoundExpression([
        `${eventArg} => (`,
        exp,
        ` = $event)`
    ])

    const props = [
        // modelValue: foo
        createObjectProperty(propName, dir.exp),
        // "onUpdate:modelValue": $event => (foo = $event)
        createObjectProperty(eventName, assignmentExp)
    ]

    // cache v-model handler if applicable (when it doesn't refer any scope vars)
    if (
        !__BROWSER__ &&
        context.prefixIdentifiers &&
        context.cacheHandlers &&
        !hasScopeRef(exp, context.identifiers)
    ) {
        props[1].value = context.cache(props[1].value)
    }

    // modelModifiers: { foo: true, "bar-baz": true }
    if (dir.modifiers.length && node.tagType === ElementTypes.COMPONENT) {
        const modifiers = dir.modifiers
            .map(m => (isSimpleIdentifier(m) ? m : JSON.stringify(m)) + `: true`)
            .join(`, `)
        const modifiersKey = arg
            ? isStaticExp(arg)
                ? `${arg.content}Modifiers`
                : createCompoundExpression([arg, ' + "Modifiers"'])
            : `modelModifiers`
        props.push(
            createObjectProperty(
                modifiersKey,
                createSimpleExpression(
                    `{ ${modifiers} }`,
                    false,
                    dir.loc,
                    ConstantTypes.CAN_HOIST
                )
            )
        )
    }

    return createTransformProps(props)
}

function createTransformProps(props = []) {
    return { props }
}
