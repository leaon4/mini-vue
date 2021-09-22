### `AST Node`的类型

1. 根节点

```javascript
{
  type: NodeTypes.ROOT,
  children: [],
}
```

2. 纯文本节点

```javascript
{
  type: NodeTypes.TEXT,
  content: string
}
```

3. 表达式节点

```javascript
{
  type: NodeTypes.SIMPLE_EXPRESSION,
  content: string,
  // 表达式是否静态。静态可以理解为content就是一段字符串；而动态的content指的是一个变量，或一段js表达式
  isStatic: boolean,
}
```

4. 插值节点

```javascript
{
  type: NodeTypes.INTERPOLATION,
  content: {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: string,
    isStatic: false,
  } // 表达式节点
}
```

5. 元素节点

```javascript
{
  type: NodeTypes.ELEMENT,
  tag: string, // 标签名,
  tagType: ElementTypes, // 是组件还是原生元素,
  props: [], // 属性节点数组,
  directives: [], // 指令数组
  isSelfClosing: boolean, // 是否是自闭合标签,
  children: [],
}
```

6. 属性节点

```javascript
{
  type: NodeTypes.ATTRIBUTE,
  name: string,
  value: undefined | {
    type: NodeTypes.TEXT,
    content: string,
  } // 纯文本节点
}
```

7. 指令节点

```javascript
{
  type: NodeTypes.DIRECTIVE,
  name: string,
  exp: undefined | {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: string,
    isStatic: false,
  }, // 表达式节点
  arg: undefined | {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: string,
    isStatic: true,
  } // 表达式节点
}
```
