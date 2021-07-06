import { h, Text, Fragment, ShapeFlags } from './vnode';

export function render(vnode, container) {
    mount(vnode, container);
}

function mount(vnode, parent) {
    const { shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        mountElement(vnode, parent);
    } else if (shapeFlag & ShapeFlags.TEXT) {
        mountTextNode(vnode, parent);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        mountFragment(vnode, parent);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {

    }
}

function mountElement(vnode, parent) {
    const { type, props, children, shapeFlag } = vnode;
    const el = document.createElement(type);

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, el);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountArrayChildren(children, el);
    }

    if (props) {
        mountProps(el, props);
    }

    parent.appendChild(el);
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

function mountTextNode(vnode, parent) {
    const textNode = document.createTextNode(vnode.children);
    parent.appendChild(textNode);
}

function mountFragment(vnode, parent) {
    mountArrayChildren(vnode.children, parent);
}

function mountArrayChildren(children, parent) {
    children.forEach(child => {
        mount(child, parent);
    });
}
