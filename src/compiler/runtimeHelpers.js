export const FRAGMENT = Symbol(`Fragment`)
export const TELEPORT = Symbol(`Teleport`)
export const SUSPENSE = Symbol(`Suspense`)
export const KEEP_ALIVE = Symbol(`KeepAlive`)
export const BASE_TRANSITION = Symbol(`BaseTransition`)
export const OPEN_BLOCK = Symbol(`openBlock`)
export const CREATE_BLOCK = Symbol(`createBlock`)
export const CREATE_VNODE = Symbol(`createVNode`)
export const CREATE_COMMENT = Symbol(`createCommentVNode`)
export const CREATE_TEXT = Symbol(`createTextVNode`)
export const CREATE_STATIC = Symbol(`createStaticVNode`)
export const RESOLVE_COMPONENT = Symbol(`resolveComponent`)
export const RESOLVE_DYNAMIC_COMPONENT = Symbol(`resolveDynamicComponent`)
export const RESOLVE_DIRECTIVE = Symbol(`resolveDirective`)
export const RESOLVE_FILTER = Symbol(`resolveFilter`)
export const WITH_DIRECTIVES = Symbol(`withDirectives`)
export const RENDER_LIST = Symbol(`renderList`)
export const RENDER_SLOT = Symbol(`renderSlot`)
export const CREATE_SLOTS = Symbol(`createSlots`)
export const TO_DISPLAY_STRING = Symbol(`toDisplayString`)
export const MERGE_PROPS = Symbol(`mergeProps`)
export const TO_HANDLERS = Symbol(`toHandlers`)
export const CAMELIZE = Symbol(`camelize`)
export const CAPITALIZE = Symbol(`capitalize`)
export const TO_HANDLER_KEY = Symbol(`toHandlerKey`)
export const SET_BLOCK_TRACKING = Symbol(`setBlockTracking`)
export const PUSH_SCOPE_ID = Symbol(`pushScopeId`)
export const POP_SCOPE_ID = Symbol(`popScopeId`)
export const WITH_SCOPE_ID = Symbol(`withScopeId`)
export const WITH_CTX = Symbol(`withCtx`)
export const UNREF = Symbol(`unref`)
export const IS_REF = Symbol(`isRef`)



export const H = Symbol(`h`)
export const TEXT = Symbol(`Text`)

// Name mapping for runtime helpers that need to be imported from 'vue' in
// generated code. Make sure these are correctly exported in the runtime!
export const helperNameMap = {
    // todo
    [H]: 'xxx',
    [TEXT]: 'Text',

    [FRAGMENT]: `Fragment`,
    [TELEPORT]: `Teleport`,
    [SUSPENSE]: `Suspense`,
    [KEEP_ALIVE]: `KeepAlive`,
    [BASE_TRANSITION]: `BaseTransition`,
    [OPEN_BLOCK]: `openBlock`,
    [CREATE_BLOCK]: `createBlock`,
    [CREATE_VNODE]: `createVNode`,
    [CREATE_COMMENT]: `createCommentVNode`,
    [CREATE_TEXT]: `createTextVNode`,
    [CREATE_STATIC]: `createStaticVNode`,
    [RESOLVE_COMPONENT]: `resolveComponent`,
    [RESOLVE_DYNAMIC_COMPONENT]: `resolveDynamicComponent`,
    [RESOLVE_DIRECTIVE]: `resolveDirective`,
    [RESOLVE_FILTER]: `resolveFilter`,
    [WITH_DIRECTIVES]: `withDirectives`,
    [RENDER_LIST]: `renderList`,
    [RENDER_SLOT]: `renderSlot`,
    [CREATE_SLOTS]: `createSlots`,
    [TO_DISPLAY_STRING]: `toDisplayString`,
    [MERGE_PROPS]: `mergeProps`,
    [TO_HANDLERS]: `toHandlers`,
    [CAMELIZE]: `camelize`,
    [CAPITALIZE]: `capitalize`,
    [TO_HANDLER_KEY]: `toHandlerKey`,
    [SET_BLOCK_TRACKING]: `setBlockTracking`,
    [PUSH_SCOPE_ID]: `pushScopeId`,
    [POP_SCOPE_ID]: `popScopeId`,
    [WITH_SCOPE_ID]: `withScopeId`,
    [WITH_CTX]: `withCtx`,
    [UNREF]: `unref`,
    [IS_REF]: `isRef`
}

export function registerRuntimeHelpers(helpers) {
    Object.getOwnPropertySymbols(helpers).forEach(s => {
        helperNameMap[s] = helpers[s]
    })
}
