// 测试改编自vue3 -> rendererChildren.spec.ts

import { render } from '../render';
import { h, Fragment } from '../vnode';

function toSpan(content) {
  if (typeof content === 'string') {
    return h('span', null, content.toString());
  } else {
    return h('span', { key: content }, content.toString());
  }
}
function serialize(el) {
  return el.outerHTML;
}
function inner(el) {
  return el.innerHTML;
}

describe('renderer: keyed children', () => {
  let root;
  let elm;
  const renderChildren = (arr) => {
    render(h('div', null, arr.map(toSpan)), root);
    return root.children[0];
  };

  beforeEach(() => {
    root = document.createElement('div');
    render(h('div', { id: 1 }, 'hello'), root);
  });

  test('append', () => {
    elm = renderChildren([1]);
    expect(elm.children.length).toBe(1);

    elm = renderChildren([1, 2, 3]);
    expect(elm.children.length).toBe(3);
    expect(serialize(elm.children[1])).toBe('<span>2</span>');
    expect(serialize(elm.children[2])).toBe('<span>3</span>');
  });

  test('reverse and append', () => {
    elm = renderChildren([1, 2]);
    expect(elm.children.length).toBe(2);

    elm = renderChildren([2, 1, 3]);
    expect(elm.children.length).toBe(3);
    expect(inner(elm)).toBe('<span>2</span><span>1</span><span>3</span>');
  });

  test('prepend', () => {
    elm = renderChildren([4, 5]);
    expect(elm.children.length).toBe(2);

    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);
    expect([...elm.children].map(inner)).toEqual(['1', '2', '3', '4', '5']);
  });

  test('insert in middle', () => {
    elm = renderChildren([1, 2, 4, 5]);
    expect(elm.children.length).toBe(4);

    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);
    expect([...elm.children].map(inner)).toEqual(['1', '2', '3', '4', '5']);
  });

  test('insert at beginning and end', () => {
    elm = renderChildren([2, 3, 4]);
    expect(elm.children.length).toBe(3);

    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);
    expect([...elm.children].map(inner)).toEqual(['1', '2', '3', '4', '5']);
  });

  test('insert to empty parent', () => {
    elm = renderChildren([]);
    expect(elm.children.length).toBe(0);

    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);
    expect([...elm.children].map(inner)).toEqual(['1', '2', '3', '4', '5']);
  });

  test('remove all children from parent', () => {
    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);
    expect([...elm.children].map(inner)).toEqual(['1', '2', '3', '4', '5']);

    render(h('div'), root);
    expect(elm.children.length).toBe(0);
  });

  test('remove from beginning', () => {
    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);

    elm = renderChildren([3, 4, 5]);
    expect(elm.children.length).toBe(3);
    expect([...elm.children].map(inner)).toEqual(['3', '4', '5']);
  });

  test('remove from end', () => {
    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);

    elm = renderChildren([1, 2, 3]);
    expect(elm.children.length).toBe(3);
    expect([...elm.children].map(inner)).toEqual(['1', '2', '3']);
  });

  test('remove from middle', () => {
    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);

    elm = renderChildren([1, 2, 4, 5]);
    expect(elm.children.length).toBe(4);
    expect([...elm.children].map(inner)).toEqual(['1', '2', '4', '5']);
  });

  test('moving single child forward', () => {
    elm = renderChildren([1, 2, 3, 4]);
    expect(elm.children.length).toBe(4);

    elm = renderChildren([2, 3, 1, 4]);
    expect(elm.children.length).toBe(4);
    expect([...elm.children].map(inner)).toEqual(['2', '3', '1', '4']);
  });

  test('moving single child backwards', () => {
    elm = renderChildren([1, 2, 3, 4]);
    expect(elm.children.length).toBe(4);

    elm = renderChildren([1, 4, 2, 3]);
    expect(elm.children.length).toBe(4);
    expect([...elm.children].map(inner)).toEqual(['1', '4', '2', '3']);
  });

  test('moving single child to end', () => {
    elm = renderChildren([1, 2, 3]);
    expect(elm.children.length).toBe(3);

    elm = renderChildren([2, 3, 1]);
    expect(elm.children.length).toBe(3);
    expect([...elm.children].map(inner)).toEqual(['2', '3', '1']);
  });

  test('swap first and last', () => {
    elm = renderChildren([1, 2, 3, 4]);
    expect(elm.children.length).toBe(4);

    elm = renderChildren([4, 2, 3, 1]);
    expect(elm.children.length).toBe(4);
    expect([...elm.children].map(inner)).toEqual(['4', '2', '3', '1']);
  });

  test('move to left & replace', () => {
    elm = renderChildren([1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(5);

    elm = renderChildren([4, 1, 2, 3, 6]);
    expect(elm.children.length).toBe(5);
    expect([...elm.children].map(inner)).toEqual(['4', '1', '2', '3', '6']);
  });

  test('move to left and leaves hold', () => {
    elm = renderChildren([1, 4, 5]);
    expect(elm.children.length).toBe(3);

    elm = renderChildren([4, 6]);
    expect([...elm.children].map(inner)).toEqual(['4', '6']);
  });

  test('moved and set to undefined element ending at the end', () => {
    elm = renderChildren([2, 4, 5]);
    expect(elm.children.length).toBe(3);

    elm = renderChildren([4, 5, 3]);
    expect(elm.children.length).toBe(3);
    expect([...elm.children].map(inner)).toEqual(['4', '5', '3']);
  });

  test('reverse element', () => {
    elm = renderChildren([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(elm.children.length).toBe(8);

    elm = renderChildren([8, 7, 6, 5, 4, 3, 2, 1]);
    expect([...elm.children].map(inner)).toEqual([
      '8',
      '7',
      '6',
      '5',
      '4',
      '3',
      '2',
      '1',
    ]);
  });

  test('something', () => {
    elm = renderChildren([0, 1, 2, 3, 4, 5]);
    expect(elm.children.length).toBe(6);

    elm = renderChildren([4, 3, 2, 1, 5, 0]);
    expect([...elm.children].map(inner)).toEqual([
      '4',
      '3',
      '2',
      '1',
      '5',
      '0',
    ]);
  });

  test('children with the same key but with different tag', () => {
    render(
      h('div', null, [
        h('div', { key: 1 }, 'one'),
        h('div', { key: 2 }, 'two'),
        h('div', { key: 3 }, 'three'),
        h('div', { key: 4 }, 'four'),
      ]),
      root
    );
    elm = root.children[0];
    expect([...elm.children].map((c) => c.tagName.toLowerCase())).toEqual([
      'div',
      'div',
      'div',
      'div',
    ]);
    expect([...elm.children].map(inner)).toEqual([
      'one',
      'two',
      'three',
      'four',
    ]);

    render(
      h('div', null, [
        h('div', { key: 4 }, 'four'),
        h('span', { key: 3 }, 'three'),
        h('span', { key: 2 }, 'two'),
        h('div', { key: 1 }, 'one'),
      ]),
      root
    );
    expect([...elm.children].map((c) => c.tagName.toLowerCase())).toEqual([
      'div',
      'span',
      'span',
      'div',
    ]);
    expect([...elm.children].map(inner)).toEqual([
      'four',
      'three',
      'two',
      'one',
    ]);
  });

  test('children with the same tag, same key, but one with data and one without data', () => {
    render(h('div', null, [h('div', { class: 'hi' }, 'one')]), root);
    elm = root.children[0];
    expect(elm.children[0].className).toBe('hi');

    render(h('div', null, [h('div', null, 'four')]), root);
    elm = root.children[0];
    expect(elm.children[0].className).toBe('');
    expect(inner(elm.children[0])).toBe(`four`);
  });

  it('patch fragment children (manual, keyed)', () => {
    render(
      h(Fragment, null, [
        h('div', { key: 1 }, 'one'),
        h('div', { key: 2 }, 'two'),
      ]),
      root
    );
    expect(inner(root)).toBe(`<div>one</div><div>two</div>`);

    render(
      h(Fragment, null, [
        h('div', { key: 2 }, 'two'),
        h('div', { key: 1 }, 'one'),
      ]),
      root
    );
    expect(inner(root)).toBe(`<div>two</div><div>one</div>`);
  });
});
