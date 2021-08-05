# VNode

## 划分虚拟 dom 的种类

1. Element
   element 对应普通元素，使用 document.createElement 创建。type 指标签名，props 指元素属性，children 指子元素，可以为字符串或数组。为字符串时代表只有一个文本子节点。

```typescript
// 类型定义
{
  type: string,
  props: Object,
  children: string | VNode[]
}

// 举例
{
  type: 'div',
  props: {class: 'a'},
  children: 'hello'
}
```

2. Text
   Text 对应文本节点，使用 document.createTextNode 创建。type 因定为一个 Symbol，props 为空，children 为字符串，指具体的文本内容。

```typescript
// 类型定义
{
  type: Symbol,
  props: null,
  children: string
}

```

3. Fragment
   Fragment 为一个不会真实渲染的节点。相当于 template 或 react 的 Fragment。type 因定为一个 Symbol，props 为空，children 为数组，表示子节点。最后渲染时子节点会挂载到 Fragment 的父节点上

```typescript
// 类型定义
{
  type: Symbol,
  props: null,
  children: []
}

```

4. Component
   Component 是组件，组件有自己特殊的一套渲染方法，但组件最终的产物，也是上面三种 VNode 的集合。组件的 type，就是定义组件的对象，props 即是外部传入组件的 props 数据，children 即是组件的 slot（但我们不准备实现 slot，跳过）。

```typescript
// 类型定义
{
  type: Object,
  props: Object,
  children: null
}

// 举例
{
  type: {
    template:`{{ msg }} {{ name }}`,
    props: ['name'],
    setup(){
      return {
        msg: 'hello'
      }
    }
  },
  props: { name: 'world' },
}
```

## ShapeFlags

ShapeFlags 是一组标记，用于快速辨识 VNode 的类型和它的 children 的类型。

#### 复习一下位运算

```javascript
// 按位与运算
0 0 1 0 0 0 1 1
0 0 1 0 1 1 1 1
&
0 0 1 0 0 0 1 1

// 按位或运算
0 0 1 0 0 0 1 1
0 0 1 0 1 1 1 1
|
0 0 1 0 1 1 1 1
```

```javascript
const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
};
```

采用二进制位运算`<<`和`|`生成，使用时用`&`运算判断，例如：

```javascript
if (flag & ShapeFlags.ELEMENT)
```

再例如，一个值为 33 的 flag，它的二进制值为 00100001，那么它：

```javascript
let flag = 33;
flag & ShapeFlags.ELEMENT; // true
flag & ShapeFlags.ARRAY_CHILDREN; // true
flag & ShapeFlags.CHILDREN; // true
```

它的生成还可以用：

```javascript
let flag = ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN;
```

## 此时我们得到 VNode 的初步形状

```javascript
{
  type,
  props,
  children,
  shapeFlag,
}
```

## h 函数

`h` 函数的用途就是生成 VNode。
它接收三个参数：`type`, `props`, `children`, 返回一个 VNode

## props

举例：

```javascript
{
  class: 'a b',
  style: {
    color: 'red',
    fontSize: '14px',
  },
  onClick: () => console.log('click'),
  checked: '',
  custom: false
}
```

先偷个懒，限定 class 只能是字符串类型，style 只能是对象类型，vue 事件只能是以 on 开头，事件名第一个字母大写的形式，如：`onClick`

#### Attributes 和 DOM Properties

[HcySunYang-渲染器之挂载](http://hcysun.me/vue-design/zh/renderer.html#attributes-%E5%92%8C-dom-properties)

```javascript
// 还要增加一个disabled
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;

if (domPropsRE.test(key)) {
  // 满足上面正则的，作为domProp赋值
  el[key] = value;
} else {
  // 否则，用setAttribute
  el.setAttribute(key, value);
}
```

但其实这样还不够，例如：

```html
<input type="checkbox" checked />
```

这里的 checked 省略了值，它翻译成 props 应该是这样：

```json
{ "checked": "" }
```

它的值是空字符串。
但如果给 input 元素的 checked 直接赋值为空字符串，它实际上是赋值为 false
因此还要加个特殊判断

```javascript
if (domPropsRE.test(key)) {
  // 满足上面正则的，作为domProp赋值
  if (value === '' && typeof el[key] === 'boolean') {
    // 例如{checked: ''}
    value = true;
  }
  el[key] = value;
}
```

再例如一个布尔类型的自定义属性 custom，如果我们传了一段 props，希望置 custom 为 false

```json
{ "custom": false }
```

这时候采用`setAttribute`会让`false`成为`"false"`，其结果仍然为 true，
所以我们需要进行判断，并且使用`removeAttribute`

```javascript
if (domPropsRE.test(key)) {
  //
} else {
  // 例如自定义属性{custom: ''}，应该用setAttribute设置为<input custom />
  // 而{custom: null}，应用removeAttribute设置为<input />
  if (value == null || value === false) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}
```

做到这样，已经能应付大部分常见的情况，但还是不能应付所有的情况。最完整的实现还是要去看源码。
