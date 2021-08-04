import { ShapeFlags } from './vnode';

export function render(vnode, container) {
  mount(vnode, container);
}

function mount(vnode, container) {
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    mountElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    mountText(vnode, container);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container);
  } else {
    mountComponent(vnode, container);
  }
}

function mountElement(vnode, container) {
  const { type, props, children, shapeFlag } = vnode;
  const el = document.createElement(type);
  mountProps(props, el);
  mountChildren(children, el);
  container.appendChild(el);
}

function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children);
  container.appendChild(el);
}

function mountFragment(vnode, container) {}

function mountComponent(vnode, container) {}

/* 
  {
    class: 'a b',
    style: {
      color: 'red',
      fontSize: '14px',
    },
    onClick: () => console.log('click'),

  }
 */
const domPropsRE = /[A-Z]|^(value|checked|selected|muted)$/;
function mountProps(props, el) {
  for (const key in props) {
    let value = props[key];
    switch (key) {
      case 'class':
        // 只接收字符串类型的class
        el.className = value;
        break;
      case 'style':
        // 只接收对象类型的style。如{color: 'red'}
        for (const styleName in value) {
          el.style[styleName] = value[styleName];
        }
        break;
      default:
        if (/^on[^a-z]/.test(key)) {
          // 事件
          const eventName = key.slice(2).toLowerCase();
          el.addEventListener(eventName, value);
        } else if (domPropsRE.test(key)) {
          if (value === '' && typeof el[key] === 'boolean') {
            value = true;
          }
          el[key] = value;
        } else {
          if (value == null || value === false) {
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, value);
          }
        }
        break;
    }
  }
}

function mountChildren(children, container) {}
