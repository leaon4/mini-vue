# scheduler

```javascript
const Comp = {
  setup() {
    const count = ref(0);
    const add = () => {
      count.value++;
      count.value++;
      count.value++;
    };
    return {
      count,
      add,
    };
  },
  render(ctx) {
    console.log('render');
    return [
      h('div', null, `count: ${ctx.count.value}`),
      h(
        'button',
        {
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
};

render(h(Comp), document.body);
```

`render` 会多次触发，因为每执行一次 `count.value++`，就会立即执行一次组件更新。
为了解决这个重复渲染的问题，因此有了 `scheduler` 的概念。

`scheduler` 的核心原理就是，当组件依赖的响应式数据发生改变时，不是立即去执行更新，而是将待执行的更新任务放入到下一个 javascript 微任务中去。待本轮的同步代码完全执行完成后，进入到下一个微任务周期时，再一起处理这些待执行的更新任务。这时候，就能对这些更新任务做去重处理了。
