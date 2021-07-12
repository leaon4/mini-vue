import { isFunction, isObject } from '../utils'
import { isReactive } from '../reactivity';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

export const ShapeFlags = {
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    COMPONENT: 1 << 3,
    TEXT_CHILDREN: 1 << 5,
    ARRAY_CHILDREN: 1 << 6,
    CHILDREN: (1 << 5) | (1 << 6)
};

/**
 * vnode有五种类型：dom元素，纯文本，Fragment，状态组件，函数组件
 * @param {string | Text | Fragment | object | Function} type 
 * @param {Record<string,any> | null} props 
 * @param {string | array | null} children 
 * @returns vnode
 */
export function h(type, props = null, children = null) {
    let shapeFlag = 0;
    if (typeof type === 'string') {
        shapeFlag = ShapeFlags.ELEMENT;
    } else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT;
    } else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT;
    } else {
        shapeFlag = ShapeFlags.COMPONENT;
    }

    if (typeof children === 'string' || typeof children === 'number') {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN;
        children = children.toString();
    } else if (Array.isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }

    if (props) {
        // for reactive or proxy objects, we need to clone it to enable mutation.
        if (isReactive(props)) {
            props = Object.assign({}, props);
        }
        // reactive state objects need to be cloned since they are likely to be
        // mutated
        if (isReactive(props.style)) {
            props.style = Object.assign({}, props.style);
        }
    }

    return {
        type,
        props,
        children,
        shapeFlag,
        el: null,
        anchor: null,
        key: props && props.key || null,
        component: null,
    };
}

export function normalizeVNode(result) {
    if (Array.isArray(result)) {
        return h(Fragment, null, result);
    }
    if (isObject(result)) {
        return result;
    }
    return h(Text, null, result.toString());
}
