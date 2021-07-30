import { render } from '../render';
import { h, Text, Fragment } from '../vnode';
import { ref, reactive, computed } from '../../reactivity';
import { nextTick } from '../scheduler';

let root;
beforeEach(() => {
  root = document.createElement('div');
});

describe('mount component', () => {
  test('mount simple component', () => {
    const Comp = {
      render() {
        return h('div');
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe('<div></div>');
  });

  test('mount component with props', () => {
    let foo, bar;
    const Comp = {
      props: ['foo'],
      render(ctx) {
        foo = ctx.foo;
        bar = ctx.bar;
        // ctx即是this，省略this实现
        return h('div', null, ctx.foo);
      },
    };
    render(h(Comp, { foo: 'foo', bar: 'bar' }), root);
    expect(root.innerHTML).toBe('<div bar="bar">foo</div>');
    expect(foo).toBe('foo');
    expect(bar).toBeUndefined();
  });

  it('should create an Component with props', () => {
    const Comp = {
      render: () => {
        return h('div');
      },
    };
    render(h(Comp, { id: 'foo', class: 'bar' }), root);
    expect(root.innerHTML).toBe(`<div id="foo" class="bar"></div>`);
  });

  it('should create an Component with direct text children', () => {
    const Comp = {
      render: () => {
        return h('div', null, 'test');
      },
    };
    render(h(Comp, { id: 'foo', class: 'bar' }), root);
    expect(root.innerHTML).toBe(`<div id="foo" class="bar">test</div>`);
  });

  it('should expose return values to template render context', () => {
    const Comp = {
      setup() {
        return {
          ref: ref('foo'),
          // object exposed as-is
          object: reactive({ msg: 'bar' }),
          // primitive value exposed as-is
          value: 'baz',
        };
      },
      render(ctx) {
        return `${ctx.ref.value} ${ctx.object.msg} ${ctx.value}`;
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe(`foo bar baz`);
  });

  test('mount multi components', () => {
    const Comp = {
      props: ['text'],
      render(ctx) {
        return h('div', null, ctx.text);
      },
    };
    render(
      h(Fragment, null, [
        h(Comp, { text: 'text1' }),
        h(Comp, { text: 'text2' }),
        h(Comp, { id: 'id' }),
      ]),
      root
    );
    expect(root.innerHTML).toBe(
      '<div>text1</div><div>text2</div><div id="id"></div>'
    );
  });

  test('mount nested components', () => {
    const Comp = {
      props: ['text'],
      render(ctx) {
        return h(Child, { text: ctx.text });
      },
    };
    const Child = {
      props: ['text'],
      render(ctx) {
        return h(Fragment, null, [
          h('div', null, ctx.text),
          h(GrandChild, { text: ctx.text, id: 'id' }),
          h(GrandChild, { text: 'hello' }),
        ]);
      },
    };
    const GrandChild = {
      props: ['text'],
      render(ctx) {
        return h('p', null, ctx.text);
      },
    };
    // 这个id会被fragment舍弃
    render(h(Comp, { text: 'text', id: 'id' }), root);
    expect(root.innerHTML).toBe(
      '<div>text</div><p id="id">text</p><p>hello</p>'
    );
  });
});

describe('unmount component', () => {
  test('unmount from root', () => {
    const Comp = {
      render() {
        return h('div');
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe('<div></div>');

    render(null, root);
    expect(root.innerHTML).toBe('');
  });

  test('unmount from inner', () => {
    const Comp = {
      render() {
        return h('div');
      },
    };
    render(h('div', null, [h(Comp)]), root);
    expect(root.innerHTML).toBe('<div><div></div></div>');

    render(h('div'), root);
    expect(root.innerHTML).toBe('<div></div>');
  });

  test('unmount multi components', () => {
    const Comp = {
      render() {
        return h('div');
      },
    };
    render(h(Fragment, null, [h(Comp), h(Comp), h(Comp)]), root);
    expect(root.innerHTML).toBe('<div></div><div></div><div></div>');

    render(null, root);
    expect(root.innerHTML).toBe('');
  });

  test('unmount nested components', () => {
    const Comp = {
      render() {
        return h(Child);
      },
    };
    const Child = {
      render() {
        return h(Fragment, null, [
          h('div'),
          h(GrandChild),
          h('div', null, [h(GrandChild)]),
        ]);
      },
    };
    const GrandChild = {
      render() {
        return h('p');
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe('<div></div><p></p><div><p></p></div>');

    render(null, root);
    expect(root.innerHTML).toBe('');
  });
});

describe('update component trigger by self', () => {
  test('setup result with event and update', async () => {
    const Comp = {
      setup() {
        const counter = ref(0);
        const click = () => {
          counter.value++;
        };
        return {
          counter,
          click,
        };
      },
      render(ctx) {
        return h('div', { onClick: ctx.click }, ctx.counter.value);
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe('<div>0</div>');

    root.children[0].click();
    await nextTick();
    expect(root.innerHTML).toBe('<div>1</div>');

    root.children[0].click();
    root.children[0].click();
    await nextTick();
    expect(root.innerHTML).toBe('<div>3</div>');
  });

  test('reactive child, style and class', async () => {
    const observed = reactive({
      child: 'child',
      class: 'a',
      style: {
        color: 'red',
      },
    });
    const Comp = {
      setup() {
        return {
          observed,
        };
      },
      render(ctx) {
        return h(
          'div',
          {
            class: ctx.observed.class,
            style: ctx.observed.style,
          },
          ctx.observed.child
        );
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe(
      '<div class="a" style="color: red;">child</div>'
    );

    observed.class = 'b';
    await nextTick();
    expect(root.innerHTML).toBe(
      '<div class="b" style="color: red;">child</div>'
    );

    observed.style.color = 'blue';
    await nextTick();
    expect(root.innerHTML).toBe(
      '<div class="b" style="color: blue;">child</div>'
    );

    observed.child = '';
    await nextTick();
    expect(root.innerHTML).toBe('<div class="b" style="color: blue;"></div>');
  });

  test('observed props', async () => {
    const observed = reactive({
      child: 'child',
      class: 'a',
      style: {
        color: 'red',
      },
    });
    const Comp = {
      render() {
        return h('div', observed);
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe(
      '<div child="child" class="a" style="color: red;"></div>'
    );

    observed.class = 'b';
    await nextTick();
    expect(root.innerHTML).toBe(
      '<div child="child" class="b" style="color: red;"></div>'
    );

    observed.style.color = 'blue';
    await nextTick();
    expect(root.innerHTML).toBe(
      '<div child="child" class="b" style="color: blue;"></div>'
    );

    observed.child = '';
    await nextTick();
    expect(root.innerHTML).toBe(
      '<div child="" class="b" style="color: blue;"></div>'
    );
  });

  test('computed and ref props', async () => {
    const firstName = ref('james');
    const lastName = ref('bond');
    const Comp = {
      setup() {
        const fullName = computed(() => {
          return `${firstName.value} ${lastName.value}`;
        });
        return {
          fullName,
        };
      },
      render(ctx) {
        return h('div', null, ctx.fullName.value);
      },
    };
    render(h(Comp), root);
    expect(root.innerHTML).toBe('<div>james bond</div>');

    firstName.value = 'a';
    await nextTick();
    expect(root.innerHTML).toBe('<div>a bond</div>');

    lastName.value = 'b';
    await nextTick();
    expect(root.innerHTML).toBe('<div>a b</div>');
  });
});

describe('update component trigger by others', () => {
  it('should update an Component tag which is already mounted', () => {
    const Comp1 = {
      render: () => {
        return h('div', null, 'foo');
      },
    };
    render(h(Comp1), root);
    expect(root.innerHTML).toBe('<div>foo</div>');

    const Comp2 = {
      render: () => {
        return h('span', null, 'foo');
      },
    };
    render(h(Comp2), root);
    expect(root.innerHTML).toBe('<span>foo</span>');

    const Comp3 = {
      render: () => {
        return h('p', null, 'bar');
      },
    };
    render(h(Comp3), root);
    expect(root.innerHTML).toBe('<p>bar</p>');
  });

  test('same component with diffrent props', () => {
    const Comp = {
      props: ['text'],
      render: (ctx) => {
        return h('p', null, ctx.text);
      },
    };
    render(h(Comp, { text: 'bar' }), root);
    expect(root.innerHTML).toBe('<p>bar</p>');

    render(h(Comp, { text: 'baz' }), root);
    expect(root.innerHTML).toBe('<p>baz</p>');
  });

  test('element and component switch', () => {
    render(h('div', null, [h('div', null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('<div>child</div>');

    const Comp = {
      render() {
        return h('p', null, 'comp');
      },
    };
    render(h('div', null, [h(Comp)]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');

    render(h('div', null, [h('div', null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('<div>child</div>');

    render(h('div', null, [h(Comp)]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');
  });

  test('component and text switch', () => {
    render(h('div', null, [h(Text, null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('child');

    const Comp = {
      render() {
        return h('p', null, 'comp');
      },
    };
    render(h('div', null, [h(Comp)]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');

    render(h('div', null, [h(Text, null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('child');

    render(h('div', null, [h(Comp)]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');
  });

  test('component and fragment switch', () => {
    render(
      h('div', null, [h(Fragment, null, [h('h1'), h(Text, null, 'child')])]),
      root
    );
    expect(root.children[0].innerHTML).toBe('<h1></h1>child');

    const Comp = {
      render() {
        return h('p', null, 'comp');
      },
    };
    render(h('div', null, [h(Comp)]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');

    render(
      h('div', null, [h(Fragment, null, [h('h1'), h(Text, null, 'child')])]),
      root
    );
    expect(root.children[0].innerHTML).toBe('<h1></h1>child');

    render(h('div', null, [h(Comp)]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');
  });

  test('parent element of component change', () => {
    const Comp = {
      props: ['text'],
      render(ctx) {
        return h('p', null, ctx.text);
      },
    };

    render(h('div', null, [h(Comp)]), root);
    expect(root.innerHTML).toBe('<div><p></p></div>');

    render(h('h1', null, [h(Comp, { text: 'text' })]), root);
    expect(root.innerHTML).toBe('<h1><p>text</p></h1>');
  });

  test('parent props update make child update', async () => {
    const text = ref('text');
    const id = ref('id');
    const Parent = {
      render() {
        return h(Child, { text: text.value, id: id.value });
      },
    };

    const Child = {
      props: ['text'],
      render(ctx) {
        return h('div', null, ctx.text);
      },
    };

    render(h(Parent), root);
    expect(root.innerHTML).toBe('<div id="id">text</div>');

    text.value = 'foo';
    await nextTick();
    expect(root.innerHTML).toBe('<div id="id">foo</div>');

    id.value = 'bar';
    await nextTick();
    expect(root.innerHTML).toBe('<div id="bar">foo</div>');
  });

  test('child will not update when props have not change', async () => {
    const text = ref('text');
    const id = ref('id');
    const anotherText = ref('a');
    const Parent = {
      render() {
        return [
          h(Text, null, anotherText.value),
          h(Child, { text: text.value, id: id.value }),
        ];
      },
    };

    let renderCount = 0;
    const Child = {
      props: ['text'],
      render(ctx) {
        renderCount++;
        return h('div', null, ctx.text);
      },
    };

    render(h(Parent), root);
    expect(root.innerHTML).toBe('a<div id="id">text</div>');
    expect(renderCount).toBe(1);

    anotherText.value = 'b';
    await nextTick();
    expect(root.innerHTML).toBe('b<div id="id">text</div>');
  });

  test('switch child', async () => {
    const Parent = {
      setup() {
        const toggle = ref(true);
        const click = () => {
          toggle.value = !toggle.value;
        };
        return {
          toggle,
          click,
        };
      },
      render(ctx) {
        return [
          ctx.toggle.value ? h(Child1) : h(Child2),
          h('button', { onClick: ctx.click }, 'click'),
        ];
      },
    };

    const Child1 = {
      render() {
        return h('div');
      },
    };

    const Child2 = {
      render() {
        return h('p');
      },
    };

    render(h(Parent), root);
    expect(root.innerHTML).toBe('<div></div><button>click</button>');

    root.children[1].click();
    await nextTick();
    expect(root.innerHTML).toBe('<p></p><button>click</button>');
  });

  test('should update parent(hoc) component host el when child component self update', async () => {
    const value = ref(true);
    let parentVnode;
    let childVnode1;
    let childVnode2;

    const Parent = {
      render: () => {
        // let Parent first rerender
        return (parentVnode = h(Child));
      },
    };

    const Child = {
      render: () => {
        return value.value
          ? (childVnode1 = h('div'))
          : (childVnode2 = h('span'));
      },
    };

    render(h(Parent), root);
    expect(root.innerHTML).toBe(`<div></div>`);
    expect(parentVnode.el).toBe(childVnode1.el);

    value.value = false;
    await nextTick();
    expect(root.innerHTML).toBe(`<span></span>`);
    expect(parentVnode.el).toBe(childVnode2.el);
  });
});
