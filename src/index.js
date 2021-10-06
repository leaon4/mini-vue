import { render, h, Text, Fragment, nextTick, createApp } from './runtime';
import { ref } from './reacitve';

createApp({
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
      h('div', { id: 'div' }, ctx.count.value),
      h(
        'button',
        {
          id: 'btn',
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
}).mount(document.body);

const div = document.getElementById('div');
const btn = document.getElementById('btn');
console.log(div.innerHTML);

btn.click();
console.log(div.innerHTML);

nextTick(() => {
  console.log(div.innerHTML);
});
