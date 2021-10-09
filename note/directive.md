# 指令

上一节在代码生成的环节中，我们已经实现了 `v-on`, `v-bind`, `v-html` 三个简单的指令，但还有一些指令是很复杂的，比如 `v-if`, `v-for`。这两个指令在 `angular` 的概念中，被称为结构指令，因为它们不像属性指令，它们会改变 dom 的结构。
另外还有一些常用指令像 `v-model`，实现也非常特殊。
接下来我们就要实现这三个特殊但常用的指令。

## v-for

示例：

```html
<div v-for="(item, index) in items">{{item + index}}</div>
```

此 `div` 会根据 `items` 的数量而去渲染相应数量的 div。而 `items` 变量来源于 `runtime`，因此 `v-for` 指令不能只靠编译完成，需要 `runtime` 配合。

编译目标：

```javascript
h(
  Fragment,
  null,
  renderList(items, (item, index) => h('div', null, item + index))
);
```

## v-if

每个 `if` 语句都包函三个部分：`condition`, `consequent`, `alternate`
组成 `condition ? consequent : alternate`

### v-if

示例：

```html
<div v-if="ok"></div>
```

编译目标：

```javascript
ok ? h('div') : h(Text, null, '');
```

### v-else

示例：

```html
<h1 v-if="ok"></h1>
<h2 v-else></h2>
<h3></h3>
```

编译目标：

```c
[
  ok ? h("h1") : h("h2"),
  h("h3")
]
```

### v-else-if

`else-if` 既是上一个条件语句的 `alternate`，又是新语句的 `condition`

示例：

```html
<h1 v-if="ok"></h1>
<h2 v-else-if="ok2"></h2>
<h3 v-else-if="ok3"></h3>
```

编译目标：

```c
ok
  ? h('h1')
  : ok2
    ? h('h2')
    : ok3
      ? h('j3')
      : h(Text, null, '');
```

### v-else-if, v-else

示例：

```html
<h1 v-if="ok"></h1>
<h2 v-else-if="ok2"></h2>
<h3 v-else></h3>
```

编译目标：

```c
ok
  ? h('h1')
  : ok2
    ? h('h2')
    : h('h3');
```

> **v-if 和 v-for 的优先级**
> 不建议 `v-if` 和 `v-for` 一起使用，因为会造成语义混乱，谁应该优先呢？
> 但它两在一起又确实是合法的。有意思的是 `vue2` 是 `v-for` 优先，`vue3` 是 `v-if` 优先。

## v-model

最早期的 `vue` 是这样描述 `v-model` 的：`v-model` 本质上是一个语法糖。
如下代码
`<input v-model="test">`
本质上是
`<input :value="test" @input="test = $event.target.value">`

但现在的 `v-model` 有着完全不同的实现。它是利用 `vue` 的自定义指令实现的。
为了图简便，我们沿用以前的设定去实现，直接将 `vModel` 改为两个指令。

```javascript
const vModel = pluck(node.directives, 'model');
if (vModel) {
  node.directives.push(
    {
      type: NodeTypes.DIRECTIVE,
      name: 'bind',
      exp: vModel.exp, // 表达式节点
      arg: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'value',
        isStatic: true,
      }, // 表达式节点
    },
    {
      type: NodeTypes.DIRECTIVE,
      name: 'on',
      exp: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: `($event) => ${vModel.exp.content} = $event.target.value`,
        isStatic: false,
      }, // 表达式节点
      arg: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'input',
        isStatic: true,
      }, // 表达式节点
    }
  );
}
```

但是这种方法只对 `input` 凑效。`v-model` 有着非常多的使用场合，每种场合效果也不尽相同，甚至还能用于组件上，因此完整的实现还是很麻烦的。
我已经实现了一套能支持 `input`, `radio`, `checkbox` 的 `v-model`。但意义不大，因为是特别私有的实现，并且这个功能也属于支线任务，就不介绍了。

## 组件的引入

组件的使用方法：需在 `createApp` 里申明 `components`（只支持全局组件）

```javascript
createApp({
  components: { Foo },
});
```

在 `runtime` 里使用 `resolveComponent` 配合
