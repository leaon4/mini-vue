import { render } from '../render';
import { h, Text, Fragment } from '../vnode';

function getTag(el) {
  return el.tagName.toLowerCase();
}
let root;
beforeEach(() => {
  root = document.createElement('div');
});

describe('unmount from root', () => {
  test('unmount element', () => {
    const root = document.createElement('div');
    render(h('div'), root);
    expect(root.children.length).toBe(1);

    render(null, root);
    expect(root.children.length).toBe(0);
  });

  test('unmount text node', () => {
    const root = document.createElement('div');
    render(h(Text, null, 'hello world!'), root);
    expect(root.firstChild.textContent).toBe('hello world!');

    render(null, root);
    expect(root.firstChild).toBeFalsy();
  });

  test('unmount fragment', () => {
    const root = document.createElement('div');
    render(
      h(Fragment, null, [h(Text, null, 'hello world!'), h('div'), h('h1')]),
      root
    );
    expect(root.childNodes[1].textContent).toBe('hello world!');
    const { children } = root;
    expect(getTag(children[0])).toBe('div');
    expect(children.length).toBe(2);

    render(null, root);
    expect(root.childNodes.length).toBe(0);
  });
});

describe('unmount from inner', () => {
  test('unmount element', () => {
    render(
      h('ul', null, [
        h('li', null, [h('span', null, 'item1')]),
        h('li', null, [h('span', null, 'item2')]),
        h('li', null, [h('span', null, 'item3'), h('span', null, 'item4')]),
      ]),
      root
    );
    expect(root.innerHTML).toBe(
      '<ul><li><span>item1</span></li>' +
        '<li><span>item2</span></li>' +
        '<li><span>item3</span><span>item4</span></li></ul>'
    );

    render(
      h('ul', null, [
        h('li', null, [h('span')]),
        h('li', null, [h('span', null, 'item4')]),
      ]),
      root
    );

    expect(root.innerHTML).toBe(
      '<ul><li><span></span></li>' + '<li><span>item4</span></li></ul>'
    );
  });

  test('unmount text node', () => {
    render(
      h('div', null, [
        h(Text, null, 'text1'),
        h('p', null, [h(Text, null, 'text2')]),
      ]),
      root
    );
    expect(root.innerHTML).toBe('<div>text1<p>text2</p></div>');

    render(h('div', null, [h('p', null, [])]), root);
    expect(root.innerHTML).toBe('<div><p></p></div>');
  });

  test('unmount fragment', () => {
    render(
      h('div', null, [h(Fragment, null, [h('h1'), h('h2'), h('h3')])]),
      root
    );
    expect(root.innerHTML).toBe('<div><h1></h1><h2></h2><h3></h3></div>');

    render(h('div'), root);
    expect(root.innerHTML).toBe('<div></div>');
  });
});
