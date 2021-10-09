import { ShapeFlags } from './vnode';
import { patchProps } from './patchProps';
import { mountComponent } from './component';

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
  unmount(vnode.component.subTree);
}

function unmountChildren(children) {
  children.forEach((child) => {
    unmount(child);
  });
}

function unmountFragment(vnode) {
  let { el: cur, anchor: end } = vnode;
  const { parentNode } = cur;
  while (cur !== end) {
    let next = cur.nextSibling;
    parentNode.removeChild(cur);
    cur = next;
  }
  parentNode.removeChild(end);
}

function processComponent(n1, n2, container, anchor) {
  if (n1) {
    // shouldComponentUpdate
    updateComponent(n1, n2);
  } else {
    mountComponent(n2, container, anchor, patch);
  }
}

function updateComponent(n1, n2) {
  n2.component = n1.component;
  n2.component.next = n2;
  n2.component.update();
}

function patch(n1, n2, container, anchor) {
  if (n1 && !isSameVNode(n1, n2)) {
    anchor = (n1.anchor || n1.el).nextSibling;
    unmount(n1);
    n1 = null;
  }

  const { shapeFlag } = n2;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container, anchor);
  } else {
    processElement(n1, n2, container, anchor);
  }
}

function isSameVNode(n1, n2) {
  return n1.type === n2.type;
}

function processText(n1, n2, container, anchor) {
  if (n1) {
    n2.el = n1.el;
    n2.el.textContent = n2.children;
  } else {
    mountTextNode(n2, container, anchor);
  }
}

function processFragment(n1, n2, container, anchor) {
  const fragmentStartAnchor = (n2.el = n1
    ? n1.el
    : document.createTextNode(''));
  const fragmentEndAnchor = (n2.anchor = n1
    ? n1.anchor
    : document.createTextNode(''));
  if (n1) {
    patchChildren(n1, n2, container, fragmentEndAnchor);
  } else {
    container.insertBefore(fragmentStartAnchor, anchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(n2.children, container, fragmentEndAnchor);
  }
}

function processElement(n1, n2, container, anchor) {
  if (n1) {
    patchElement(n1, n2);
  } else {
    mountElement(n2, container, anchor);
  }
}

function mountTextNode(vnode, container, anchor) {
  const textNode = document.createTextNode(vnode.children);
  container.insertBefore(textNode, anchor);
  vnode.el = textNode;
}

function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlag, children } = vnode;
  const el = document.createElement(type);

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 这里不用传anchor，因为这里的el是新建的，anchor等同于最后一个
    mountChildren(children, el);
  }

  if (props) {
    patchProps(null, props, el);
  }

  container.insertBefore(el, anchor);
  vnode.el = el;
}

// patchElement不需要anchor
function patchElement(n1, n2) {
  n2.el = n1.el;
  patchProps(n1.props, n2.props, n2.el);
  patchChildren(n1, n2, n2.el);
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
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = '';
      mountChildren(c2, container, anchor);
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 只要第一个元素有key,那么就当作都有key
      if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
        patchKeyedChildren(c1, c2, container, anchor);
      } else {
        patchUnkeyedChildren(c1, c2, container, anchor);
      }
    } else {
      mountChildren(c2, container, anchor);
    }
  } else {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = '';
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1);
    }
  }
}

function mountChildren(children, container, anchor) {
  children.forEach((child) => {
    patch(null, child, container, anchor);
  });
}

function patchUnkeyedChildren(c1, c2, container, anchor) {
  const oldLength = c1.length;
  const newLength = c2.length;
  const commonLength = Math.min(oldLength, newLength);
  for (let i = 0; i < commonLength; i++) {
    patch(c1[i], c2[i], container, anchor);
  }
  if (oldLength > newLength) {
    unmountChildren(c1.slice(commonLength));
  } else if (oldLength < newLength) {
    mountChildren(c2.slice(commonLength), container, anchor);
  }
}

function patchKeyedChildren2(c1, c2, container, anchor) {
  const map = new Map();
  c1.forEach((prev, j) => {
    map.set(prev.key, { prev, j });
  });
  let maxNewIndexSoFar = 0;
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i];
    const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling;
    if (map.has(next.key)) {
      const { prev, j } = map.get(next.key);
      patch(prev, next, container, anchor);
      if (j < maxNewIndexSoFar) {
        container.insertBefore(next.el, curAnchor);
      } else {
        maxNewIndexSoFar = j;
      }
      map.delete(next.key);
    } else {
      patch(null, next, container, curAnchor);
    }
  }
  map.forEach(({ prev }) => {
    unmount(prev);
  });
}

function patchKeyedChildren(c1, c2, container, anchor) {
  let i = 0;
  let e1 = c1.length - 1;
  let e2 = c2.length - 1;

  // 1.从左至右依次比对
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], container, anchor);
    i++;
  }

  // 2.从右至左依次比对
  while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
    patch(c1[e1], c2[e2], container, anchor);
    e1--;
    e2--;
  }

  if (i > e1) {
    // 3. 经过 1、2 直接将旧结点比对完，则剩下的新结点直接 mount
    for (let j = i; j <= e2; j++) {
      const nextPos = e2 + 1;
      const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
      patch(null, c2[j], container, curAnchor);
    }
  } else if (i > e2) {
    // 3. 经过 1、2 直接将新结点比对完，则剩下的旧结点直接 unmount
    for (let j = i; j <= e1; j++) {
      unmount(c1[j]);
    }
  } else {
    // 4.若不满足 3，采用传统 diff 算法，但不真的添加和移动，只做标记和删除
    const map = new Map();
    for (let j = i; j <= e1; j++) {
      const prev = c1[j];
      map.set(prev.key, { prev, j });
    }
    let maxNewIndexSoFar = 0;
    let move = false;
    const source = new Array(e2 - i + 1).fill(-1);
    const toMounted = [];
    for (let k = 0; k < source.length; k++) {
      const next = c2[k + i];
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key);
        patch(prev, next, container, anchor);
        if (j < maxNewIndexSoFar) {
          move = true;
        } else {
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        map.delete(next.key);
      } else {
        toMounted.push(k + i);
      }
    }
    map.forEach(({ prev }) => {
      unmount(prev);
    });

    if (move) {
      // 5.需要移动，则采用新的最长上升子序列算法
      const seq = getSequence(source);
      let j = seq.length - 1;
      for (let k = source.length - 1; k >= 0; k--) {
        if (seq[j] === k) {
          // 不用移动
          j--;
        } else {
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
          if (source[k] === -1) {
            // mount
            patch(null, c2[pos], container, curAnchor);
          } else {
            // 移动
            container.insertBefore(c2[pos].el, curAnchor);
          }
        }
      }
    } else if (toMounted.length) {
      // 6.特殊情况：不需要移动，但还有未添加的元素
      for (let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k];
        const nextPos = pos + 1;
        const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
        patch(null, c2[pos], container, curAnchor);
      }
    }
  }
}

var getSequence = function (nums) {
  const arr = [nums[0]];
  const position = [0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
      position.push(arr.length - 1);
    } else {
      let l = 0,
        r = arr.length - 1;
      while (l <= r) {
        let mid = ~~((l + r) / 2);
        if (nums[i] > arr[mid]) {
          l = mid + 1;
        } else if (nums[i] < arr[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      arr[l] = nums[i];
      position.push(l);
    }
  }

  let cur = arr.length - 1;
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      arr[cur--] = i;
    }
  }
  return arr;
};
