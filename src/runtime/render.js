import { ShapeFlags } from './vnode';
import { patchProps } from './patchProps';

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

function unmountComponent(vnode) {
  // todo
}

function unmountFragment(vnode) {}

function unmountChildren(children) {
  children.forEach((child) => {
    unmount(child);
  });
}

function processComponent(n1, n2, container) {
  // todo
}

function patch(n1, n2, container) {
  if (n1 && !isSameVNode(n1, n2)) {
    unmount(n1);
  }

  const { shapeFlag } = n2;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(n1, n2, container);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container);
  } else {
    processElement(n1, n2, container);
  }
}

function isSameVNode(n1, n2) {
  return n1.type === n2.type;
}

function processText(n1, n2, container) {
  if (n1) {
    n2.el = n1.el;
    n2.el.textContent = n2.chilren;
  } else {
    mountTextNode(n2, container);
  }
}

function processFragment(n1, n2, container) {
  // if (n1) {
  //   patchChildren(n1, n2, container);
  // } else {
  //   mountChildren(n2.children, container);
  // }
}

function processElement(n1, n2, container) {
  if (n1) {
    patchElement(n1, n2, container);
  } else {
    mountElement(n2, container);
  }
}

function mountTextNode(vnode, container) {
  const textNode = document.createTextNode(vnode.children);
  container.appendChild(textNode);
  vnode.el = textNode;
}

function mountElement(vnode, container) {
  const { type, props, shapeFlag, children } = vnode;
  const el = document.createElement(type);
  patchProps(null, props, el);

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }

  container.appendChild(el);
  vnode.el = el;
}

function patchElement(n1, n2, container) {
  n2.el = n1.el;
  patchProps(n1.props, n2.props, n2.el);
  patchChildren(n1, n2, container);
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
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = '';
      mountChildren(c2, container);
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // todo patchArrayChildren
      patchUnkeyedChildren(c1, c2, container);
    } else {
      mountChildren(c2, container);
    }
  } else {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = '';
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1);
    }
  }
}

function mountChildren(children, container) {
  children.forEach((child) => {
    patch(null, child, container);
  });
}

function patchUnkeyedChildren(c1, c2, container){
  
}
