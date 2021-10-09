import { traverseNode } from '../codegen';
import { parse } from '../parse';
function compile(template) {
  const ast = parse(template);
  return traverseNode(ast);
}

describe('compiler: integration tests', () => {
  describe('text and interpolation', () => {
    test('simple text', () => {
      const code = compile('foo');
      expect(code).toBe('h(Text, null, "foo")');
    });

    test('no consecutive text', () => {
      const code = compile('{{ foo }}');
      expect(code).toBe('h(Text, null, foo)');
    });

    test('expression', () => {
      const code = compile('{{ foo + bar }}');
      expect(code).toBe('h(Text, null, foo + bar)');
    });

    test('consecutive text', () => {
      const code = compile('{{ foo }} bar {{ baz }}');
      expect(code).toBe(
        '[h(Text, null, foo), h(Text, null, " bar "), h(Text, null, baz)]'
      );
    });

    test('consecutive text between elements', () => {
      const code = compile('<div/>{{ foo }} bar {{ baz }}<div/>');
      expect(code).toBe(
        '[h("div"), h(Text, null, foo), h(Text, null, " bar "), h(Text, null, baz), h("div")]'
      );
    });

    test('text between elements (static)', () => {
      const code = compile('<div/>hello<div/>');
      expect(code).toBe('[h("div"), h(Text, null, "hello"), h("div")]');
    });

    test('consecutive text mixed with elements', () => {
      const code = compile('<div/>{{ foo }} bar {{ baz }}<div/>hello<div/>');
      expect(code).toBe(
        '[h("div"), h(Text, null, foo), h(Text, null, " bar "), ' +
          'h(Text, null, baz), h("div"), h(Text, null, "hello"), h("div")]'
      );
    });
  });

  describe('element', () => {
    test('single element', () => {
      const code = compile('<p/>');
      expect(code).toBe('h("p")');
    });

    test('with text child', () => {
      const code = compile('<div>fine</div>');
      expect(code).toBe('h("div", null, "fine")');
    });

    // test('import + resolve component', () => {
    //     const code = compile('<Foo/>');
    //     expect(code).toBe('h("Foo")');
    // })

    test('static props', () => {
      const code = compile(`<div id="foo" class="bar" />`);
      expect(code).toBe('h("div", { id: "foo", class: "bar" })');
    });

    test('props + children', () => {
      const code = compile(`<div id="foo"><span/></div>`);
      expect(code).toBe('h("div", { id: "foo" }, [h("span")])');
    });
  });

  describe('v-if', () => {
    test('basic v-if', () => {
      const code = compile('<div v-if="ok"/>');
      expect(code).toBe('ok ? h("div") : h(Text, null, "")');
    });

    // test('component v-if', () => {
    //     const { node } = parseWithIfTransform(`<Component v-if="ok"></Component>`)
    //     expect(node.type).toBe(NodeTypes.IF)
    //     expect(node.branches.length).toBe(1)
    //     expect((node.branches[0].children[0]).tag).toBe(
    //         `Component`
    //     )
    //     expect((node.branches[0].children[0]).tagType).toBe(
    //         ElementTypes.COMPONENT
    //     )
    // })

    test('v-if + v-else', () => {
      const code = compile('<div v-if="ok"/><p v-else/>');
      expect(code).toBe('ok ? h("div") : h("p")');
    });

    test('v-if + v-else-if', () => {
      const code = compile('<div v-if="ok"/><p v-else-if="orNot"/>');
      expect(code).toBe('ok ? h("div") : orNot ? h("p") : h(Text, null, "")');
    });

    test('v-if + v-else-if + v-else', () => {
      const code = compile(
        '<div v-if="ok"/><p v-else-if="orNot"/><h1 v-else>fine</h1>'
      );
      expect(code).toBe(
        'ok ? h("div") : orNot ? h("p") : h("h1", null, "fine")'
      );
    });

    test('with spaces between branches', () => {
      const code = compile(
        '<div v-if="ok"/> <p v-else-if="no"/> <span v-else/>'
      );
      expect(code).toBe('ok ? h("div") : no ? h("p") : h("span")');
    });

    test('nested', () => {
      const code = compile(
        `
                <div v-if="ok">ok</div>
                <div v-else-if="foo">
                    <h1 v-if="a"></h1>
                    <h2 v-else-if="b"></h2>
                    <h3 v-if="c"></h3>
                    <h4 v-else-if="d"></h4>
                    <h5 v-else-if="e"></h5>
                    <h6 v-else>
                        <div>hello world</div>
                    </h6>
                </div>
                <span v-else></span>
            `.trim()
      );

      /* 
                ok
                    ? h("div", null, "ok")
                    : foo
                        ? h("div", null, [
                            a
                                ? h("h1")
                                : b
                                    ? h("h2")
                                    : h(Text, null, ""),
                            c
                                ? h("h3")
                                : d
                                    ? h("h4")
                                    : e
                                        ? h("h5")
                                        : h("h6", null, [h("div", null, "hello world")])
                        ])
                        : h("span")
             */
      expect(code).toBe(
        'ok ? h("div", null, "ok") : foo ? h("div", null, [a ? h("h1") : b ? h("h2") : h(Text, null, ""), c ? h("h3") : d ? h("h4") : e ? h("h5") : h("h6", null, [h("div", null, "hello world")])]) : h("span")'
      );
    });
  });

  describe('v-for', () => {
    test('number expression', () => {
      const code = compile('<span v-for="index in 5" />');
      expect(code).toBe('h(Fragment, null, renderList(5, index => h("span")))');
    });

    test('object de-structured value', () => {
      const code = compile('<span v-for="({ id, value }) in items" />');
      expect(code).toBe(
        'h(Fragment, null, renderList(items, ({ id, value }) => h("span")))'
      );
    });

    test('array de-structured value', () => {
      const code = compile('<span v-for="([ id, value ]) in items" />');
      expect(code).toBe(
        'h(Fragment, null, renderList(items, ([ id, value ]) => h("span")))'
      );
    });

    test('value and key', () => {
      const code = compile('<span v-for="(item, key) in items" />');
      expect(code).toBe(
        'h(Fragment, null, renderList(items, (item, key) => h("span")))'
      );
    });

    test('value, key and index', () => {
      const code = compile('<span v-for="(value, key, index) in items" />');
      expect(code).toBe(
        'h(Fragment, null, renderList(items, (value, key, index) => h("span")))'
      );
    });

    test('with key', () => {
      const code = compile('<span v-for="item in items" :key="item.id" />');
      expect(code).toBe(
        'h(Fragment, null, renderList(items, item => h("span", { key: item.id })))'
      );
    });

    // 不支持
    /* test('skipped key', () => {
            const code = compile('<span v-for="(value,,index) in items" />');
            expect(code).toBe('h(Fragment, null, renderList(items, (value,,index) => h("span")))');
        }) */

    test('nested', () => {
      const code = compile(
        '<ul v-for="item in items"><li v-for="child in item.list">{{child.text}}</li></ul>'
      );
      expect(code).toBe(
        'h(Fragment, null, renderList(items, item => h("ul", null, [h(Fragment, null, renderList(item.list, child => h("li", null, child.text)))])))'
      );
    });

    test('v-if + v-for', () => {
      const code = compile('<div v-if="ok" v-for="i in list"/>');
      expect(code).toBe(
        'ok ? h(Fragment, null, renderList(list, i => h("div"))) : h(Text, null, "")'
      );
    });
  });

  describe('v-bind, v-on', () => {
    test('v-bind', () => {
      const code = compile('<div v-bind:id="id" :class="a" />');
      expect(code).toBe('h("div", { id: id, class: a })');
    });

    test('v-on', () => {
      const code = compile(
        '<div v-on:click="onClick" @mousedown="onMouseDown" />'
      );
      expect(code).toBe(
        'h("div", { onClick: onClick, onMousedown: onMouseDown })'
      );
    });

    test('inline statement', () => {
      const code = compile('<div @click="foo($event, id)"/>');
      expect(code).toBe('h("div", { onClick: $event => (foo($event, id)) })');
    });

    test('inline statement2', () => {
      const code = compile('<div @click="() => i++"/>');
      expect(code).toBe('h("div", { onClick: () => i++ })');
    });

    test('compound', () => {
      const code = compile(`
            <div :class="class"
                @click="foo"
                style="color: red"
                v-for="item in items"
                v-if="ok" />
            `);
      expect(code).toBe(
        'ok ? h(Fragment, null, renderList(items, item => h("div", { style: "color: red", class: class, onClick: foo }))) : h(Text, null, "")'
      );
    });
  });
});
