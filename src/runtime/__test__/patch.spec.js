import { render } from '../render';
import { h, Text } from '../vnode';

function getTag(el) {
  return el.tagName.toLowerCase();
}

let root;
beforeEach(() => {
  root = document.createElement('div');
});

describe('patch props', () => {
  test('patch class', () => {
    let el;
    render(h('div'), root);
    el = root.children[0];
    expect(el.className).toBeFalsy();

    render(h('div', {}), root);
    el = root.children[0];
    expect(el.className).toBeFalsy();

    render(h('div', { class: '' }), root);
    el = root.children[0];
    expect(el.className).toBe('');

    render(h('div', { class: 'a' }), root);
    el = root.children[0];
    expect(el.className).toBe('a');

    render(h('div', { class: 'b' }), root);
    el = root.children[0];
    expect(el.className).toBe('b');

    render(h('div'), root);
    el = root.children[0];
    expect(el.className).toBeFalsy();
  });

  test('patch style', () => {
    let el;
    render(h('div'), root);
    el = root.children[0];
    expect(el.style.color).toBeFalsy();

    render(
      h('div', {
        style: { color: 'red' },
      }),
      root
    );
    el = root.children[0];
    expect(el.style.color).toBe('red');

    render(
      h('div', {
        style: {
          color: 'blue',
          border: '1px solid',
          fontSize: '12px',
        },
      }),
      root
    );
    el = root.children[0];
    expect(el.style.color).toBe('blue');
    expect(el.style.border).toBe('1px solid');
    expect(el.style.fontSize).toBe('12px');

    render(
      h('div', {
        style: {
          color: 'yellow',
        },
      }),
      root
    );
    el = root.children[0];
    expect(el.style.color).toBe('yellow');
    expect(el.style.border).toBeFalsy();
    expect(el.style.fontSize).toBeFalsy();

    render(h('div'), root);
    el = root.children[0];
    expect(el.style.color).toBeFalsy();
    expect(el.getAttribute('style')).toBeFalsy();
  });

  test('patch props and attrs', () => {
    let el;
    render(h('div'), root);
    el = root.children[0];
    expect(el.id).toBeFalsy();
    expect(el.getAttribute('foo')).toBeFalsy();

    render(h('div', { id: 'a', foo: 'foo' }), root);
    el = root.children[0];
    expect(el.id).toBe('a');
    expect(el.getAttribute('foo')).toBe('foo');

    render(h('div', { id: 'b', bar: 'bar' }), root);
    el = root.children[0];
    expect(el.id).toBe('b');
    expect(el.getAttribute('foo')).toBeFalsy();
    expect(el.getAttribute('bar')).toBe('bar');

    render(h('div'), root);
    el = root.children[0];
    expect(el.id).toBeFalsy();
    expect(el.getAttribute('foo')).toBeFalsy();
    expect(el.getAttribute('bar')).toBeFalsy();
  });

  test('patch event', () => {
    let el,
      dummy = 0;
    render(h('div', { onClick: () => dummy++ }), root);
    el = root.children[0];
    el.click();
    expect(dummy).toBe(1);

    // 事件不会被绑定两次
    render(h('div', { onClick: () => dummy++ }), root);
    el = root.children[0];
    el.click();
    expect(dummy).toBe(2);

    const triggerMousedown = () => {
      const event = new Event('mousedown');
      el.dispatchEvent(event);
    };

    render(h('div', { onMousedown: () => (dummy += 10) }), root);
    el = root.children[0];
    el.click();
    expect(dummy).toBe(2);
    triggerMousedown();
    expect(dummy).toBe(12);

    render(h('div'), root);
    el = root.children[0];
    el.click();
    triggerMousedown();
    expect(dummy).toBe(12);
  });

  test('disabled', () => {
    render(h('input'), root);
    const input = root.children[0];
    expect(input.disabled).toBe(false);

    render(h('input', { disabled: '' }), root);
    expect(input.disabled).toBe(true);

    render(h('input', { disabled: false }), root);
    expect(input.disabled).toBe(false);

    render(h('input', { disabled: true }), root);
    expect(input.disabled).toBe(true);
  });

  test('checked', () => {
    render(h('input', { type: 'checkbox' }), root);
    const input = root.children[0];
    expect(input.checked).toBe(false);

    render(h('input', { type: 'checkbox', checked: '' }), root);
    expect(input.checked).toBe(true);

    render(h('input', { type: 'checkbox', checked: false }), root);

    expect(input.checked).toBe(false);

    render(h('input', { type: 'checkbox', checked: true }), root);
    expect(input.checked).toBe(true);
  });

  test('selected', () => {
    render(
      h('select', null, [
        h('option', { value: 'a' }, 'a'),
        h('option', { value: 'b' }, 'b'),
      ]),
      root
    );
    const select = root.children[0];
    expect(select.value).toBe('a');

    render(
      h('select', null, [
        h('option', { value: 'a' }, 'a'),
        h('option', { value: 'b', selected: '' }, 'b'),
      ]),
      root
    );
    expect(select.value).toBe('b');

    render(
      h('select', null, [
        h('option', { value: 'a' }, 'a'),
        h('option', { value: 'b', selected: false }, 'b'),
      ]),
      root
    );
    expect(select.value).toBe('a');

    render(
      h('select', null, [
        h('option', { value: 'a' }, 'a'),
        h('option', { value: 'b', selected: true }, 'b'),
      ]),
      root
    );
    expect(select.value).toBe('b');
  });
});

describe('patch unkeyed nodes', () => {
  test('should patch previously empty children', () => {
    render(h('div', null, []), root);
    expect(root.children[0].textContent).toBeFalsy();

    render(h('div', null, 'hello'), root);
    expect(root.children[0].textContent).toBe('hello');
  });

  test('should patch previously null children', () => {
    render(h('div'), root);

    render(h('div', null, 'hello'), root);
    expect(root.children[0].textContent).toBe('hello');
  });

  test('array children -> text children', () => {
    render(h('div', null, [h('p')]), root);
    expect(getTag(root.children[0].children[0])).toBe('p');

    render(h('div', null, 'hello'), root);
    expect(root.children[0].textContent).toBe('hello');
  });

  test('patch test 1', () => {
    render(
      h('div', null, [h('p', null, 'item1'), h('p', null, 'item2')]),
      root
    );
    expect(root.innerHTML).toBe('<div><p>item1</p><p>item2</p></div>');

    render(
      h('div', null, [h('span', null, 'item3'), h('p', null, 'item2')]),
      root
    );
    expect(root.innerHTML).toBe('<div><span>item3</span><p>item2</p></div>');
  });

  test('patch test 2', () => {
    render(
      h('div', null, [
        h('div', null, 'start'),
        h('ul', null, [
          h(Text, null, 'item0'),
          h('li', null, [h('span', null, 'item1')]),
          h('li', null, [h('span', null, 'item2'), h('span', null, 'item3')]),
          h('li', null, [h('span', null, 'item4')]),
          h(Text, null, 'item5'),
        ]),
        h('div', null, 'end'),
      ]),
      root
    );
    expect(root.innerHTML).toBe(
      '<div><div>start</div>' +
        '<ul>item0<li><span>item1</span></li>' +
        '<li><span>item2</span><span>item3</span></li>' +
        '<li><span>item4</span></li>item5</ul>' +
        '<div>end</div></div>'
    );

    render(
      h('div', null, [
        h('div', null, 'end'),
        h('ul', null, [
          h('li', null, [h('span', null, [h(Text, null, 'item1')])]),
          h('li', null, [h('span', null, 'item3')]),
          h('li', null, [h('p', null, 'item6'), h('span', null, 'item8')]),
          h(Text, null, 'itemEnd'),
        ]),
      ]),
      root
    );
    expect(root.innerHTML).toBe(
      '<div><div>end</div>' +
        '<ul><li><span>item1</span></li>' +
        '<li><span>item3</span></li>' +
        '<li><p>item6</p><span>item8</span></li>' +
        'itemEnd</ul></div>'
    );
  });
});
