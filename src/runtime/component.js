import { reactive, effect } from '../reacitve';
import { normalizeVNode } from './vnode';

function updateProps(instance, vnode) {
  const { type: Component, props: vnodeProps } = vnode;
  const props = (instance.props = {});
  const attrs = (instance.attrs = {});
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }

  instance.props = reactive(instance.props);
}

function fallThrough(instance, subTree) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...instance.attrs,
    };
  }
}

export function mountComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;

  const instance = (vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    subTree: null,
    isMounted: false,
    update: null,
    next: null,
  });

  updateProps(instance, vnode);

  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });

  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  instance.update = effect(() => {
    if (!instance.isMounted) {
      // mount
      const subTree = (instance.subTree = normalizeVNode(
        Component.render(instance.ctx)
      ));

      fallThrough(instance, subTree);

      patch(null, subTree, container, anchor);
      vnode.el = subTree.el;
      instance.isMounted = true;
    } else {
      // update

      if (instance.next) {
        // 被动更新
        vnode = instance.next;
        instance.next = null;
        updateProps(instance, vnode);
        instance.ctx = {
          ...instance.props,
          ...instance.setupState,
        };
      }

      const prev = instance.subTree;
      const subTree = (instance.subTree = normalizeVNode(
        Component.render(instance.ctx)
      ));

      fallThrough(instance, subTree);

      patch(prev, subTree, container, anchor);
      vnode.el = subTree.el;
    }
  });
}
