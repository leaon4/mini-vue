import { render } from '../render';
import { h, Fragment } from '../vnode';
import { ref } from '../../reactivity';
import { nextTick } from '../scheduler';

let root;
beforeEach(() => {
  root = document.createElement('div');
});

function createComp(fn) {
  return {
    setup() {
      const counter = ref(0);
      const click = () => {
        counter.value++;
        counter.value++;
        counter.value++;
      };
      const click2 = () => {
        setTimeout(() => {
          counter.value++;
          counter.value++;
          counter.value++;
        }, 100);
      };
      return {
        counter,
        click,
        click2,
      };
    },
    render(ctx) {
      fn();
      return [
        h('div', null, ctx.counter.value),
        h('button', { onClick: ctx.click }, 'sync add'),
        h(
          'button',
          { onClick: ctx.click2, style: { marginLeft: '8px' } },
          'async add'
        ),
      ];
    },
  };
}

describe('scheduler', () => {
  test('multi sync mutation will render only once', async () => {
    const spy = jest.fn();
    const Comp = createComp(spy);
    render(h(Comp), root);
    expect(spy).toHaveReturnedTimes(1);

    const div = root.children[0];
    const syncBtn = root.children[1];

    syncBtn.click();
    await nextTick();
    expect(div.innerHTML).toBe('3');
    expect(spy).toHaveBeenCalledTimes(2);

    syncBtn.click();
    syncBtn.click();
    await nextTick();
    expect(div.innerHTML).toBe('9');
    expect(spy).toHaveBeenCalledTimes(3);
  });

  test('multi async mutation will render only once', async () => {
    jest.useFakeTimers();
    const spy = jest.fn();
    const Comp = createComp(spy);
    render(h(Comp), root);
    expect(spy).toHaveReturnedTimes(1);

    const div = root.children[0];
    const asyncBtn = root.children[2];

    asyncBtn.click();
    await jest.advanceTimersByTime(150);
    expect(div.innerHTML).toBe('3');
    expect(spy).toHaveBeenCalledTimes(2);

    asyncBtn.click();
    await jest.advanceTimersByTime(150);
    expect(div.innerHTML).toBe('6');
    expect(spy).toHaveBeenCalledTimes(3);
  });

  test('two sibling components can render correctly', async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const ref1 = ref(0);
    const ref2 = ref(10);
    const Comp1 = {
      render() {
        spy1();
        return h('div', null, ref1.value);
      },
    };

    const Comp2 = {
      render() {
        spy2();
        return h('div', null, ref2.value);
      },
    };

    render(h(Fragment, null, [h(Comp1), h(Comp2)]), root);
    expect(root.innerHTML).toBe('<div>0</div><div>10</div>');
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);

    ref1.value++;
    ref1.value++;
    ref2.value++;
    ref2.value++;
    await nextTick();
    expect(root.innerHTML).toBe('<div>2</div><div>12</div>');
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);
  });

  test('two nested components can render correctly', async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const ref1 = ref(0);
    const ref2 = ref(10);
    const Parent = {
      render() {
        spy1();
        return h(Child, { value: ref1.value });
      },
    };

    const Child = {
      props: ['value'],
      render(ctx) {
        spy2();
        return h('div', null, ctx.value + ref2.value);
      },
    };

    render(h(Parent), root);
    expect(root.innerHTML).toBe('<div>10</div>');
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);

    ref1.value++;
    ref1.value++;
    await nextTick();
    expect(root.innerHTML).toBe('<div>12</div>');
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);

    ref1.value++;
    ref1.value++;
    ref2.value += 10;
    ref2.value += 10;
    await nextTick();
    expect(root.innerHTML).toBe('<div>34</div>');
    expect(spy1).toHaveBeenCalledTimes(3);
    // vue能处理这种情况。应该是在组件更新时，要到job里去停止任务
    // expect(spy2).toHaveBeenCalledTimes(3)
  });
});
