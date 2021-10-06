# Component

## 组件是什么

> 从开发者的视角来看，组件分为状态组件和函数组件
> vue 其实也有函数式组件，但它和状态组件，从实现上来讲几乎没有多大区别，
> 因此我们只考虑状态组件，以下所讲的组件都是指状态组件

##### React 的组件示例（class 组件）

```javascript
class Counter extends React.Component {
  state = {
    count: 0,
  };
  add = () => {
    this.setState({
      count: this.state.count + 1,
    });
  };
  render() {
    const { count } = this.state;
    return (
      <>
        <div>{count}</div>
        <button onClick={this.add}>add</button>
      </>
    );
  }
}
```

##### Vue3 的组件示例（optional）（渲染函数）

```javascript
createApp({
  data() {
    return {
      count: 0,
    };
  },
  methods: {
    add() {
      this.count++;
    },
  },
  render(ctx) {
    return [
      h('div', null, ctx.count),
      h(
        'button',
        {
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
}).mount('#app');
```

##### Vue3 的组件示例（composition）（渲染函数）

```javascript
createApp({
  setup() {
    const count = ref(0);
    const add = () => count.value++;
    return {
      count,
      add,
    };
  },
  render(ctx) {
    return [
      h('div', null, ctx.count),
      h(
        'button',
        {
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
}).mount('#app');
```

可以看出，从实现的角度来讲，组件都有一些共同点：

- 都有 `instance`（实例），以承载内部的状态，方法等
- 都有一个 `render` 函数
- 都通过 `render` 函数产出 `VNode`
- 都有一套更新策略，以重新执行 `render` 函数
- 在此基础上附加各种能力，如生命周期，通信机制，`slot`，`provide inject`等等

因此，创建一个组件需要以下几个步骤：

1. 创建一个组件实例，初始化实例状态
2. 准备 `render` 函数所需要的参数（或者 `this context`）
3. 执行 `render` 函数，产出 `VNode`，继续进行 `patch`
4. 根据更新策略进行更新－－重复以上步骤

思路：

1. 创建实例，给实例添加一个 `state` 属性，以承载组件内部状态。对于 vue3 来说，这个 `state` 就是 `setupState`
2. 准备执行 setup 函数，以得到 setupState
3. 分析 setupState 的参数 `setup(props, { attrs, slots, emit })` https://v3.cn.vuejs.org/guide/composition-api-setup.html#%E5%8F%82%E6%95%B0
4. 执行 initProps，得到 props 和 attrs(两者的区别)
5. 执行 setup，得到 setupState(舍去 proxyRefs)
6. props 和 setupState 合并为 ctx
7. 先来个 mount 方法，然后执行，完成 mount。就用 counter 组件
8. 为使 counter 的 add 事件动起来，再来个 update 方法
9. 为使 update 能自动执行，先将 mount 和 update 合而为一，再 effect 包起来

## prop 和 attr

```javascript
const Comp = {
  props: ['foo'],
  render(ctx) {
    return h('div', { class: 'a', id: ctx.bar }, ctx.foo);
  },
};

const vnodeProps = {
  foo: 'foo',
  bar: 'bar',
};

const vnode = h(Comp, vnodeProps);
render(vnode, root); // 渲染为<div class="a" bar="bar">foo</div>
```

> 组件产物的 vnode 命名为 subTree

`Comp.props` 决它接收哪些外部传入的 `vnodeProps`，把它放入 `instance.props`，而其他属性会添加进 `instance.attrs`。
`render` 中的 `ctx` 只会使用 `instance.props`。`render` 的产物 `subTree` 的 `subTreeProps`，除使用`{class: 'a'}`以外，还会继承 `instance.attrs`

## normalizeVNode

方便函数能直接返回数组，字符串，数字

## 更新

### 主动更新

只需要重新执行 `render` 函数，再 `patch`

### atr fallthrough

https://v3.cn.vuejs.org/guide/component-attrs.html#attribute-%E7%BB%A7%E6%89%BF

### 被动更新

被动更新发生的场景

```javascript
const Child = {
  props: ['foo'],
  render(ctx) {
    return h('div', { class: 'a', id: ctx.bar }, ctx.foo);
  },
};

const Parent = {
  setup() {
    const vnodeProps = reactive({
      foo: 'foo',
      bar: 'bar',
    });
    return { vnodeProps };
  },
  render(ctx) {
    return h(Child, ctx.vnodeProps);
  },
};

render(h(Parent), root);
```

可以看出被动更新时，`vnode.type` 是完全相等的，改变的只可能是 `vnodeProps`

因此，被动更新的流程为：
`instance` 不用改变，让新 `vnode` 继承
`vnodeProps` 可能会改变，所以 `instance.props` 要更新
`props` 更新了以后，`ctx` 要更新（因为我们的实现问题）
`setup` 方法不用再执行，沿用 `setupState`
`vnode` 也要更新，因此存入 `next` 中带过去

#### shouldComponentUpdate

## 组件的卸载

简单起见，直接 `unmount subTree`
