import { render, h, Text } from './runtime';

const vnode = h(
  'div',
  {
    class: 'a b',
    style: {
      border: '1px solid',
      fontSize: '14px',
    },
    onClick: () => console.log('click'),
    checked: '',
    custom: false,
  },
  [
    h('ul', null, [
      h('li', { style: { color: 'red' } }, 1),
      h('li', null, 2),
      h('li', { style: { color: 'blue' } }, 3),
      h('li', null, [h(Text, null, 'hello world')]),
    ]),
  ]
);

render(vnode, document.body);

{
  /* <style>
  .a {
    background-color: aqua;
  }

  .b {
    padding: 20px;
  }
</style> */
}
