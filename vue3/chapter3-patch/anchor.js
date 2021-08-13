import { render, h, Text, Fragment } from './runtime';

render(
  h('ul', null, [
    h('li', null, 'first'),
    h(Fragment, null, []),
    h('li', null, 'last'),
  ]),
  document.body
);
setTimeout(() => {
  render(
    h('ul', null, [
      h('li', null, 'first'),
      h(Fragment, null, [
        h('li', null, 'middle'),
      ]),
      h('li', null, 'last'),
    ]),
    document.body
  );
}, 2000);
