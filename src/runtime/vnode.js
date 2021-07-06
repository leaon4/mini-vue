import { isFunction, isObject } from '../utils'

export const Text = Symbol('text');
export const Fragment = Symbol('fragment');

export const ShapeFlags = {
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    STATEFUL_COMPONENT: 1 << 3,
    FUNCTIONAL_COMPONENT: 1 << 4,
    COMPONENT: (1 << 3) | (1 << 4),
    TEXT_CHILDREN: 1 << 5,
    ARRAY_CHILDREN: 1 << 6,
    CHILDREN: (1 << 5) | (1 << 6)
};

export function h(type, props = null, children = null) {
    let shapeFlag = 0;
    if (typeof type === 'string') {
        shapeFlag = ShapeFlags.ELEMENT;
    } else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT;
    } else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT;
    } else if (isFunction(type)) {
        shapeFlag = ShapeFlags.FUNCTIONAL_COMPONENT;
    } else {
        shapeFlag = ShapeFlags.STATEFUL_COMPONENT;
    }

    if (typeof children === 'string') {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    } else if (Array.isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    
    return {
        type,
        props,
        children,
        shapeFlag
    };
}
