import { h, Text, Fragment, ShapeFlags } from './vnode';

export function render(vnode, container) {
    const prevVNode = container._vnode;
    if (!vnode) {
        if (prevVNode) {
            unmount(prevVNode);
        }
    } else {
        patch(prevVNode, vnode, container);
    }
    container._vnode = vnode;
}

// n1可能为null，n2不可能为null
function patch(n1, n2, container, anchor) {
    if (n1 && !isSameVNodeType(n1, n2)) {
        anchor = (n1.anchor || n1.el).nextSibling;
        unmount(n1);
        n1 = null;
    }

    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(n1, n2, container, anchor)
    } else if (shapeFlag & ShapeFlags.TEXT) {
        processText(n1, n2, container, anchor)
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        processFragment(n1, n2, container, anchor)
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
        processComponent(n1, n2, container, anchor)
    }
}

function mountElement(vnode, container, anchor) {
    const { type, props, shapeFlag, children } = vnode;
    const el = document.createElement(type);

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 这里不能传anchor。因为anchor限制的是当前的element
        // 作为本element的children，不用指定anchor，append就行
        mountChildren(children, el)
    }

    if (props) {
        patchProps(el, null, props)
    }

    vnode.el = el;
    container.insertBefore(el, anchor || null)
}

function mountTextNode(vnode, container, anchor) {
    const textNode = document.createTextNode(vnode.children);
    vnode.el = textNode;
    container.insertBefore(textNode, anchor || null)
}

function mountChildren(children, container, anchor) {
    children.forEach(child => {
        patch(null, child, container, anchor);
    });
}

// TODO
function mountComponent(vnode, container) {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        mountStatefulComponent(vnode, container);
    } else {

    }
}

function mountStatefulComponent(vnode, container) {
    const { type: comp, props } = vnode;

    const ctx = {}
    if (props && comp.props) {
        comp.props.forEach(key => {
            if (key in props) {
                ctx[key] = props[key]
            }
        });
    }

    const subtree = comp.render(ctx);
    patch(null, subtree, container);
}

function unmount(vnode) {
    const { shapeFlag, el } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT) {
        unmountComponent(vnode);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        unmountFragment(vnode);
    } else {
        el.parentNode.removeChild(el);
    }
}

// TODO
function unmountComponent(vnode) {

}

function unmountFragment(vnode) {
    let { el: cur, anchor: end } = vnode;
    while (cur !== end) {
        let next = cur.nextSibling;
        cur.parentNode.removeChild(cur);
        cur = next;
    }
    end.parentNode.removeChild(end);
}

function isSameVNodeType(n1, n2) {
    return n1.type === n2.type;
}

function processElement(n1, n2, container, anchor) {
    if (n1 == null) {
        mountElement(n2, container, anchor);
    } else {
        patchElement(n1, n2);
    }
}

function processFragment(n1, n2, container, anchor) {
    const fragmentStartAnchor = n2.el = n1
        ? n1.el
        : document.createTextNode('')
    const fragmentEndAnchor = n2.anchor = n1
        ? n1.anchor
        : document.createTextNode('')
    if (n1 == null) {
        container.insertBefore(fragmentStartAnchor, anchor || null)
        container.insertBefore(fragmentEndAnchor, anchor || null)
        mountChildren(n2.children, container, fragmentEndAnchor)
    } else {
        patchChildren(n1, n2, container, fragmentEndAnchor)
    }
}

function processText(n1, n2, container, anchor) {
    if (n1 == null) {
        mountTextNode(n2, container, anchor)
    } else {
        n2.el = n1.el;
        n2.el.textContent = n2.children;
    }
}

// TODO
function processComponent(n1, n2, container, anchor) {
    if (n1 == null) {
        mountComponent(n2, container, anchor);
    } else {

    }
}

function patchElement(n1, n2) {
    n2.el = n1.el;
    patchProps(n2.el, n1.props, n2.props)
    patchChildren(n1, n2, n2.el)
}

function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps) {
        return;
    }
    oldProps = oldProps || {};
    newProps = newProps || {};
    for (const key in newProps) {
        if (key === 'key') {
            continue;
        }
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
            patchDomProp(el, key, prev, next)
        }
    }
    for (const key in oldProps) {
        if (key !== 'key' && !(key in newProps)) {
            patchDomProp(el, key, oldProps[key], null)
        }
    }
}

const domPropsRE = /[A-Z]|^(value|checked|selected|muted)$/;
function patchDomProp(el, key, prev, next) {
    switch (key) {
        case 'class':
            // 暂时认为class就是字符串
            el.className = next || '';
            break;
        case 'style':
            // style为对象
            if (!next) {
                el.removeAttribute('style');
            } else {
                for (const styleName in next) {
                    el.style[styleName] = next[styleName];
                }
                if (prev) {
                    for (const styleName in prev) {
                        if (next[styleName] == null) {
                            el.style[styleName] = '';
                        }
                    }
                }
            }
            break;
        default:
            if (key.startsWith('on')) {
                // 事件
                if (prev !== next) {
                    const eventName = key.slice(2).toLowerCase();
                    if (prev) {
                        el.removeEventListener(eventName, prev);
                    }
                    if (next) {
                        el.addEventListener(eventName, next);
                    }
                }
            } else if (domPropsRE.test(key)) {
                el[key] = next;
            } else {
                if (next == null) {
                    el.removeAttribute(key)
                } else {
                    el.setAttribute(key, next);
                }
            }
            break;
    }
}

function patchChildren(n1, n2, container, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1);
        }
        if (c2 !== c1) {
            container.textContent = c2;
        }
    } else {
        // c2 is array or null
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // c1 was array
            if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // c2 is array
                // 简单认为头一个元素有key就都有key
                if (c1[0] && c1[0].key && c2[0] && c2[0].key) {
                    patchKeyedChildren(c1, c2, container, anchor);
                } else {
                    // console.warn('请添加一个key')
                    patchUnkeyedChildren(c1, c2, container, anchor);
                }
            } else {
                // c2 is null
                unmountChildren(c1);
            }
        } else {
            // c1 was text or null
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                container.textContent = '';
            }
            if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                mountChildren(c2, container, anchor);
            }
        }
    }
}

function unmountChildren(children) {
    children.forEach(child => unmount(child));
}

function patchUnkeyedChildren(c1, c2, container, anchor) {
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let i = 0; i < commonLength; i++) {
        patch(c1[i], c2[i], container, anchor);
    }
    if (newLength > oldLength) {
        mountChildren(c2.slice(commonLength), container, anchor)
    } else if (newLength < oldLength) {
        unmountChildren(c1.slice(commonLength))
    }
}

// 不用考虑children是fragment的情况，因为fragment没有key
// 而且平级的fragment间也没有上联合diff的必要
// 并假设没有重复key
function patchKeyedChildren(c1, c2, container, anchor) {
    const map = new Map();
    c1.forEach((prev, j) => {
        map.set(prev.key, { prev, j });
    });
    let lastIndex = 0;
    for (let i = 0; i < c2.length; i++) {
        const next = c2[i];
        const curAnchor = i === 0
            ? c1[0].el
            : c2[i - 1].el.nextSibling;
        if (map.has(next.key)) {
            const { prev, j } = map.get(next.key);
            patch(prev, next, container, anchor);
            if (j < lastIndex) {
                container.insertBefore(next.el, curAnchor);
            } else {
                lastIndex = j;
            }
            map.delete(next.key);
        } else {
            patch(null, next, container, curAnchor)
        }
    }
    map.forEach(({ prev }) => {
        if (!c2.find(next => next.key === prev.key)) {
            unmount(prev);
        }
    })
}
