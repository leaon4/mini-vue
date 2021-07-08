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
function patch(n1, n2, container) {
    if (n1 && !isSameVNodeType(n1, n2)) {
        unmount(n1);
        n1 = null;
    }

    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(n1, n2, container)
    } else if (shapeFlag & ShapeFlags.TEXT) {
        processText(n1, n2, container)
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        processFragment(n1, n2, container)
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
        processComponent(n1, n2, container)
    }
}

function mountElement(vnode, container) {
    const { type, props, shapeFlag, children } = vnode;
    const el = document.createElement(type);

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el)
    }

    if (props) {
        patchProps(el, null, props)
    }

    vnode.el = el;
    container.appendChild(el);
}

function mountTextNode(vnode, container) {
    const textNode = document.createTextNode(vnode.children);
    vnode.el = textNode;
    container.appendChild(textNode);
}

function mountChildren(children, container) {
    children.forEach(child => {
        patch(null, child, container);
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

function processElement(n1, n2, container) {
    if (n1 == null) {
        mountElement(n2, container);
    } else {
        patchElement(n1, n2, container);
    }
}

function processFragment(n1, n2, container) {
    if (n1 == null) {
        const fragmentStartAnchor = n2.el = document.createTextNode('')
        const fragmentEndAnchor = n2.anchor = document.createTextNode('')
        container.appendChild(fragmentStartAnchor)
        mountChildren(n2.children, container)
        // 这里会不会有问题?
        container.appendChild(fragmentEndAnchor)
    } else {
        patchChildren(n1, n2, container)
    }
}

function processText(n1, n2, container) {
    if (n1 == null) {
        mountTextNode(n2, container)
    } else {
        n2.el = n1.el;
        n2.el.textContent = n2.children;
    }
}

// TODO
function processComponent(n1, n2, container) {
    if (n1 == null) {
        mountComponent(n2, container);
    } else {

    }
}

function patchElement(n1, n2, container) {
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

function patchChildren(n1, n2, container) {
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
                patchUnkeyedChildren(c1, c2, container);
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
                mountChildren(c2, container);
            }
        }
    }
}

function unmountChildren(children) {
    children.forEach(child => unmount(child));
}

function patchUnkeyedChildren(c1, c2, container) {
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let i = 0; i < commonLength; i++) {
        patch(c1[i], c2[i], container);
    }
    if (newLength > oldLength) {
        mountChildren(c2.slice(commonLength))
    } else if (newLength < oldLength) {
        unmountChildren(c1.slice(commonLength))
    }
}
