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

function mountElement(vnode, container) {
    const { type, props, shapeFlag, children } = vnode;
    const el = document.createElement(type);

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el)
    }

    if (props) {
        mountProps(el, props);
    }

    vnode.el = el;
    container.appendChild(el);
}

const domPropsRE = /[A-Z]|^(value|checked|selected|muted)$/;
function mountProps(el, props) {
    for (const key in props) {
        const value = props[key]
        switch (key) {
            case 'class':
                // 暂时认为class就是字符串
                el.className = value;
                break;
            case 'style':
                // style为对象
                for (const styleName in value) {
                    el.style[styleName] = value[styleName];
                }
                break;
            default:
                if (key.startsWith('on')) {
                    el.addEventListener(key.slice(2).toLowerCase(), value)
                } else if (domPropsRE.test(key)) {
                    el[key] = value;
                } else {
                    el.setAttribute(key, value);
                }
        }
    }
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

// TODO
function patchElement(n1, n2, container) {

}
