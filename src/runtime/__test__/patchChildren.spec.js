import { render } from '../render';
import { h, Text, Fragment } from '../vnode';

let root;
beforeEach(() => {
  root = document.createElement('div');
});
const makeNodes = (arr) => {
  return {
    nodes: arr.map((tag) => h(tag)),
    html: arr.map((tag) => `<${tag}></${tag}>`).join(''),
  };
};

describe('element anchor order check', () => {
  test('tag order', () => {
    let result;
    result = makeNodes(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);

    result = makeNodes(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].reverse());
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);

    result = makeNodes(['h2', 'h2', 'h5', 'h5', 'h3', 'h6']);
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);
  });

  test('tag and text order', () => {
    render(
      h('div', null, [h(Text, null, 'text1'), h('p'), h(Text, null, 'text2')]),
      root
    );
    expect(root.children[0].innerHTML).toBe('text1<p></p>text2');

    render(
      h('div', null, [h('p'), h(Text, null, 'text2'), h(Text, null, 'text1')]),
      root
    );
    expect(root.children[0].innerHTML).toBe('<p></p>text2text1');
  });

  test('tag will be more or less', () => {
    let result;
    result = makeNodes(['h1', 'h2', 'h3']);
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);

    result = makeNodes(['h5', 'h1', 'h4', 'h2', 'h3']);
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);

    result = makeNodes(['h2', 'h3']);
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);

    result = makeNodes([]);
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);
  });

  test('tag and text will be more or less', () => {
    render(h('div', null, [h(Text, null, 'text1')]), root);
    expect(root.children[0].innerHTML).toBe('text1');

    render(
      h('div', null, [h('p'), h(Text, null, 'text2'), h(Text, null, 'text1')]),
      root
    );
    expect(root.children[0].innerHTML).toBe('<p></p>text2text1');

    render(
      h('div', null, [
        h('p'),
        h(Text, null, 'text2'),
        h('div', null, 'text3'),
        h(Text, null, 'text1'),
      ]),
      root
    );
    expect(root.children[0].innerHTML).toBe(
      '<p></p>text2<div>text3</div>text1'
    );

    render(
      h('div', null, [h(Text, null, 'text2'), h(Text, null, 'text1')]),
      root
    );
    expect(root.children[0].innerHTML).toBe('text2text1');

    render(h('div'), root);
    expect(root.children[0].innerHTML).toBe('');
  });
});

describe('fragment anchor order', () => {
  test('fragment to element', () => {
    render(h(Fragment, null, [h('div')]), root);
    expect(root.innerHTML).toBe('<div></div>');

    render(h('p'), root);
    expect(root.innerHTML).toBe('<p></p>');
  });

  test('fragment order', () => {
    let result;
    result = makeNodes(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    render(h(Fragment, null, result.nodes), root);
    expect(root.innerHTML).toBe(result.html);

    result = makeNodes(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].reverse());
    render(h(Fragment, null, result.nodes), root);
    expect(root.innerHTML).toBe(result.html);

    result = makeNodes(['h2', 'h2', 'h5', 'h5', 'h3', 'h6']);
    render(h(Fragment, null, result.nodes), root);
    expect(root.innerHTML).toBe(result.html);
  });

  test('fragment will be more or less', () => {
    let result;
    result = makeNodes(['h1', 'h2', 'h3']);
    render(h(Fragment, null, result.nodes), root);
    expect(root.innerHTML).toBe(result.html);

    result = makeNodes(['h5', 'h1', 'h4', 'h2', 'h3']);
    render(h(Fragment, null, result.nodes), root);
    expect(root.innerHTML).toBe(result.html);

    result = makeNodes(['h2', 'h3']);
    render(h(Fragment, null, result.nodes), root);
    expect(root.innerHTML).toBe(result.html);

    result = makeNodes([]);
    render(h(Fragment, null, result.nodes), root);
    expect(root.innerHTML).toBe(result.html);
  });

  test('multi fragments and elements', () => {
    let result1, result2, result3;
    result1 = makeNodes(['h1', 'h2', 'h3']);
    result2 = makeNodes(['h4', 'h5', 'h6']);
    result3 = makeNodes(['h7', 'h8', 'h9']);
    render(
      h(Fragment, null, [
        h(Fragment, null, result1.nodes),
        h(Fragment, null, result2.nodes),
        h(Fragment, null, result3.nodes),
      ]),
      root
    );
    expect(root.innerHTML).toBe(result1.html + result2.html + result3.html);

    result1 = makeNodes(['h1', 'h2', 'h3']);
    result2 = makeNodes(['h4', 'h5', 'h6']);
    result3 = makeNodes(['h7', 'h8', 'h9']);
    render(
      h(Fragment, null, [
        h(Fragment, null, result3.nodes),
        h(Fragment, null, result1.nodes),
        h(Fragment, null, result2.nodes),
      ]),
      root
    );
    expect(root.innerHTML).toBe(result3.html + result1.html + result2.html);

    result1 = makeNodes(['h1', 'h2', 'h3']);
    result2 = makeNodes(['h4', 'h5', 'h6']);
    result3 = makeNodes(['h7', 'h8', 'h9']);
    render(
      h(Fragment, null, [
        h(Fragment, null, result2.nodes),
        h('div', null, 'new tag1'),
        h(Fragment, null, result3.nodes),
        h(Fragment, null, result1.nodes),
        h(Text, null, 'new tag2'),
      ]),
      root
    );
    expect(root.innerHTML).toBe(
      result2.html +
        '<div>new tag1</div>' +
        result3.html +
        result1.html +
        'new tag2'
    );

    result1 = makeNodes(['h1', 'h2', 'h3']);
    render(h(Fragment, null, [h(Fragment, null, result1.nodes)]), root);
    expect(root.innerHTML).toBe(result1.html);

    render(null, root);
    expect(root.innerHTML).toBe('');
    expect(root.childNodes.length).toBe(0);
  });
});

describe('patchChildren', () => {
  test('text children -> text children -> null', () => {
    render(h(Text, null, 'foo'), root);
    expect(root.innerHTML).toBe('foo');

    render(h(Text, null, 'bar'), root);
    expect(root.innerHTML).toBe('bar');

    render(null, root);
    expect(root.innerHTML).toBe('');
  });

  test('text children => array children 1', () => {
    render(h(Text, null, 'text'), root);
    expect(root.innerHTML).toBe('text');

    render(h(Fragment, null, [h('div'), h('div')]), root);
    expect(root.innerHTML).toBe('<div></div><div></div>');
  });

  test('text children => array children 2', () => {
    render(h('div', null, 'text'), root);
    expect(root.innerHTML).toBe('<div>text</div>');

    render(h('div', null, [h('h1'), h('h2')]), root);
    expect(root.innerHTML).toBe('<div><h1></h1><h2></h2></div>');
  });

  test('array children -> text children', () => {
    render(h('div', null, [h('h1'), h('h2')]), root);
    expect(root.innerHTML).toBe('<div><h1></h1><h2></h2></div>');

    render(h('div', null, 'text'), root);
    expect(root.innerHTML).toBe('<div>text</div>');
  });

  test('keyed children', () => {
    render(
      h(Fragment, null, [
        h('input', { key: 0, checked: true }),
        h('input', { key: 1, checked: false }),
        h('input', { key: 2, checked: false }),
      ]),
      root
    );
    expect(root.innerHTML).toBe('<input><input><input>');
    expect(root.children[0].checked).toBe(true);
    expect(root.children[1].checked).toBe(false);
    expect(root.children[2].checked).toBe(false);

    render(
      h(Fragment, null, [
        h('input', { key: 1, checked: false }),
        h('input', { key: 2, checked: false }),
      ]),
      root
    );
    expect(root.innerHTML).toBe('<input><input>');
    expect(root.children[0].checked).toBe(false);
    expect(root.children[1].checked).toBe(false);
  });
});
