import { reactive, effect } from '../reactivity';
import { normalizeVNode } from './vnode';
import { queueJob } from './scheduler';
import { compile } from '../compiler';

function updateComponentProps(instance, vnode) {
    const { type: originalComp, props: vnodeProps } = vnode;
    for (const key in vnodeProps) {
        if (originalComp.props && originalComp.props.includes(key)) {
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
    const { type: originalComp } = vnode;

    const instance = {
        // type: originalComp, // 和vue3一致，但暂时没用
        props: {},
        attrs: {},
        setupState: null,
        ctx: null,
        // 源码：instance.setupState = proxyRefs(setupResult)
        update: null,
        isMounted: false,
    };

    updateComponentProps(instance, vnode);

    instance.setupState = originalComp.setup?.(instance.props, {
        attrs: instance.attrs,
    });

    if (!originalComp.render && originalComp.template) {
        let { template } = originalComp;
        if (template[0] === '#') {
            const el = document.querySelector(template);
            template = el ? el.innerHTML : ``;
        }
        originalComp.render = new Function('ctx', compile(template));
        console.log(originalComp.render);
    }

    // toThink: ctx需要响应式吗?
    instance.ctx = {
        ...instance.props, // 解构后应该没有响应式了
        ...instance.setupState,
    };
    instance.update = effect(
        () => {
            if (!instance.isMounted) {
                // mount
                const subTree = (instance.subTree = normalizeVNode(
                    originalComp.render(instance.ctx)
                ));
                if (Object.keys(instance.attrs)) {
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
                    updateComponentProps(instance, vnode);
                    instance.ctx = {
                        ...instance.props,
                        ...instance.setupState,
                    };
                }

                const prev = instance.subTree;
                const subTree = (instance.subTree = normalizeVNode(
                    originalComp.render(instance.ctx)
                ));
                if (Object.keys(instance.attrs)) {
                    subTree.props = {
                        ...subTree.props,
                        ...instance.attrs,
                    };
                }
                // anchor may have changed if it's in a fragment
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
