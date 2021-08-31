import { reactive, effect } from '../reactivity';
import { normalizeVNode } from './vnode';
import { queueJob } from './scheduler';
import { compile } from '../compiler';

function updateProps(instance, vnode) {
  const { type: Component, props: vnodeProps } = vnode;
  for (const key in vnodeProps) {
    if (Component.props && Component.props.includes(key)) {
      instance.props[key] = vnodeProps[key];
    } else {
      instance.attrs[key] = vnodeProps[key];
    }
  }
  // toThink: props源码是shallowReactive，确实需要吗?
  // 需要。否则子组件修改props不会触发更新
  instance.props = reactive(instance.props);
}

export function mountComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;

  // createComponentInstance
  const instance = {
    props: {},
    attrs: {},
    setupState: null,
    ctx: null,
    update: null,
    isMounted: false,
    subTree: null,
  };

  // setupComponent
  updateProps(instance, vnode);

  // 源码：instance.setupState = proxyRefs(setupResult)
  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });

  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  if (!Component.render && Component.template) {
    let { template } = Component;
    if (template[0] === '#') {
      const el = document.querySelector(template);
      template = el ? el.innerHTML : ``;
    }
    Component.render = new Function('ctx', compile(template));
  }

  // setupRenderEffect
  instance.update = effect(
    () => {
      if (!instance.isMounted) {
        // mount
        const subTree = (instance.subTree = normalizeVNode(
          Component.render(instance.ctx)
        ));

        // attr fallthrough
        if (Object.keys(instance.attrs).length) {
          subTree.props = {
            ...subTree.props,
            ...instance.attrs,
          };
        }

        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        vnode.el = subTree.el;
      } else {
        // update

        // instance.next存在，代表是被动更新。否则是主动更新
        if (instance.next) {
          vnode = instance.next;
          instance.next = null;
          instance.props = reactive(instance.props);
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
        if (Object.keys(instance.attrs).length) {
          subTree.props = {
            ...subTree.props,
            ...instance.attrs,
          };
        }
        patch(prev, subTree, container, anchor);
        vnode.el = subTree.el;
      }
    },
    {
      scheduler: queueJob,
    }
  );
  vnode.component = instance;
}
