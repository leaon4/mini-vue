import { render } from '../render';
import { h, Text, Fragment } from '../vnode';
import { ref, reactive } from '../../reacitve';

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
});
