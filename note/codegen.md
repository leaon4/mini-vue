# Code Generate

## 编译的步骤

![vue3-demo](./assets/compiler.png)

## codegen 的私有实现

从 `AST` 到渲染函数代码，`vue` 经过了 `transform`, `codegen` 两个步骤。
但 `vue` 的 `transform` 太复杂了。起初我模仿 `vue` 的实现，也跟着写了 `transform` 和 `codegen` 两个步骤，最后哪怕是经过了大量精简，代码量也非常大。
后来我将这两个步骤合而为一，发现突然简单了很多，只用了 200 来行代码，就完成了从 AST 到渲染函数代码的实现。
也因此，这部分实现和 `vue` 差异很大，基本上都是我自己的私货。
但也建议大家看一看，毕竟就 200 行代码，流程也是基本一致的。

## 生成的代码如何使用？

```html
Counter
<div>{{count}}</div>
<button @click="add">click</button>
```
