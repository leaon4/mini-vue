import { parse } from '../parse';
import { NodeTypes, ElementTypes } from '../ast';

describe('compiler: parse', () => {
  describe('Text', () => {
    test('simple text', () => {
      const ast = parse('some text');
      const text = ast.children[0];

      expect(text).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text',
      });
    });

    test('text with interpolation', () => {
      const ast = parse('some {{ foo + bar }} text');
      const text1 = ast.children[0];
      const text2 = ast.children[2];

      expect(text1).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some ',
      });
      expect(text2).toStrictEqual({
        type: NodeTypes.TEXT,
        content: ' text',
      });
    });

    test('text with interpolation which has `<`', () => {
      const ast = parse('some {{ a<b && c>d }} text');
      const text1 = ast.children[0];
      const text2 = ast.children[2];

      expect(text1).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some ',
      });
      expect(text2).toStrictEqual({
        type: NodeTypes.TEXT,
        content: ' text',
      });
    });

    test('text with interpolation which has `<`', () => {
      const ast = parse('some {{ a<b && c>d }} text');
      const text1 = ast.children[0];
      const text2 = ast.children[2];

      expect(text1).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some ',
      });
      expect(text2).toStrictEqual({
        type: NodeTypes.TEXT,
        content: ' text',
      });
    });

    test('text with mix of tags and interpolations', () => {
      const ast = parse('some <span>{{ foo < bar + foo }} text</span>');
      const text1 = ast.children[0];
      const text2 = ast.children[1].children[1];

      expect(text1).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some ',
      });
      expect(text2).toStrictEqual({
        type: NodeTypes.TEXT,
        content: ' text',
      });
    });
  });
  describe('Interpolation', () => {
    test('simple interpolation', () => {
      const ast = parse('{{message}}');
      const interpolation = ast.children[0];

      expect(interpolation).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `message`,
          isStatic: false,
        },
      });
    });

    test('it can have tag-like notation', () => {
      const ast = parse('{{ a<b }}');
      const interpolation = ast.children[0];

      expect(interpolation).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `a<b`,
          isStatic: false,
        },
      });
    });

    test('it can have tag-like notation (2)', () => {
      const ast = parse('{{ a<b }}{{ c>d }}');
      const interpolation1 = ast.children[0];
      const interpolation2 = ast.children[1];

      expect(interpolation1).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `a<b`,
          isStatic: false,
        },
      });

      expect(interpolation2).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          isStatic: false,
          content: 'c>d',
        },
      });
    });

    test('it can have tag-like notation (3)', () => {
      const ast = parse('<div>{{ "</div>" }}</div>');
      const element = ast.children[0];
      const interpolation = element.children[0];

      expect(interpolation).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          isStatic: false,
          content: '"</div>"',
        },
      });
    });

    test('delimiters', () => {
      const ast = parse('<p>{{msg}}</p>');
      const element = ast.children[0];
      const interpolation = element.children[0];
      expect(interpolation).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `msg`,
          isStatic: false,
        },
      });
    });
  });

  describe('Element', () => {
    test('simple div', () => {
      const ast = parse('<div>hello</div>');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,
        props: [],
        directives: [],
        isSelfClosing: false,
        children: [
          {
            type: NodeTypes.TEXT,
            content: 'hello',
          },
        ],
      });
    });

    test('empty', () => {
      const ast = parse('<div></div>');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('self closing', () => {
      const ast = parse('<div/>after');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [],
        directives: [],
        isSelfClosing: true,
        children: [],
      });
    });

    test('void element', () => {
      const ast = parse('<img>after');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'img',
        tagType: ElementTypes.ELEMENT,

        props: [],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('native element with `isNativeTag`', () => {
      const ast = parse('<div></div><comp></comp><Comp></Comp>');

      expect(ast.children[0]).toMatchObject({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,
      });

      expect(ast.children[1]).toMatchObject({
        type: NodeTypes.ELEMENT,
        tag: 'comp',
        tagType: ElementTypes.COMPONENT,
      });

      expect(ast.children[2]).toMatchObject({
        type: NodeTypes.ELEMENT,
        tag: 'Comp',
        tagType: ElementTypes.COMPONENT,
      });
    });

    test('attribute with no value', () => {
      const ast = parse('<div id></div>');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: undefined,
          },
        ],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('attribute with empty value, double quote', () => {
      const ast = parse('<div id=""></div>');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: '',
            },
          },
        ],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('attribute with empty value, single quote', () => {
      const ast = parse("<div id=''></div>");
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: '',
            },
          },
        ],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('attribute with value, double quote', () => {
      const ast = parse('<div id=">\'"></div>');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: ">'",
            },
          },
        ],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('attribute with value, single quote', () => {
      const ast = parse("<div id='>\"'></div>");
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: '>"',
            },
          },
        ],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('multiple attributes', () => {
      const ast = parse('<div id="a" class="c" inert style=\'\'></div>');
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: 'a',
            },
          },
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'class',
            value: {
              type: NodeTypes.TEXT,
              content: 'c',
            },
          },
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'inert',
            value: undefined,
          },
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'style',
            value: {
              type: NodeTypes.TEXT,
              content: '',
            },
          },
        ],
        directives: [],
        isSelfClosing: false,
        children: [],
      });
    });

    test('directive with no value', () => {
      const ast = parse('<div v-if/>');
      const directive = ast.children[0].directives[0];

      expect(directive).toStrictEqual({
        type: NodeTypes.DIRECTIVE,
        name: 'if',
        arg: undefined,
        exp: undefined,
      });
    });

    test('directive with value', () => {
      const ast = parse('<div v-if="a"/>');
      const directive = ast.children[0].directives[0];

      expect(directive).toStrictEqual({
        type: NodeTypes.DIRECTIVE,
        name: 'if',
        arg: undefined,
        exp: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'a',
          isStatic: false,
        },
      });
    });

    test('directive with argument', () => {
      const ast = parse('<div v-on:click/>');
      const directive = ast.children[0].directives[0];

      expect(directive).toStrictEqual({
        type: NodeTypes.DIRECTIVE,
        name: 'on',
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'click',
          isStatic: true,
        },
        exp: undefined,
      });
    });

    test('v-bind shorthand', () => {
      const ast = parse('<div :a="b" />');
      const directive = ast.children[0].directives[0];

      expect(directive).toStrictEqual({
        type: NodeTypes.DIRECTIVE,
        name: 'bind',
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'a',
          isStatic: true,
        },
        exp: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'b',
          isStatic: false,
        },
      });
    });

    test('v-on shorthand', () => {
      const ast = parse('<div @a="b" />');
      const directive = ast.children[0].directives[0];

      expect(directive).toStrictEqual({
        type: NodeTypes.DIRECTIVE,
        name: 'on',
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'a',
          isStatic: true,
        },
        exp: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'b',
          isStatic: false,
        },
      });
    });

    test('end tags are case-insensitive.', () => {
      const ast = parse('<div>hello</DIV>after');
      const element = ast.children[0];
      const text = element.children[0];

      expect(text).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'hello',
      });
    });

    test('self closing single tag', () => {
      const ast = parse('<div :class="{ some: condition }" />');

      expect(ast.children).toHaveLength(1);
      expect(ast.children[0]).toMatchObject({ tag: 'div' });
    });

    test('self closing multiple tag', () => {
      const ast = parse(
        `<div :class="{ some: condition }" />\n` +
          `<p v-bind:style="{ color: 'red' }"/>`
      );

      expect(ast).toMatchSnapshot();

      expect(ast.children).toHaveLength(2);
      expect(ast.children[0]).toMatchObject({ tag: 'div' });
      expect(ast.children[1]).toMatchObject({ tag: 'p' });
    });

    test('valid html', () => {
      const ast = parse(
        `<div :class="{ some: condition }">\n` +
          `  <p v-bind:style="{ color: 'red' }"/>\n` +
          `</div>`
      );

      expect(ast).toMatchSnapshot();

      expect(ast.children).toHaveLength(1);
      const el = ast.children[0];
      expect(el).toMatchObject({
        tag: 'div',
      });
      expect(el.children).toHaveLength(1);
      expect(el.children[0]).toMatchObject({
        tag: 'p',
      });
    });
  });

  describe('whitespace management when adopting strategy condense', () => {
    it('should remove whitespaces w/ newline between elements', () => {
      const ast = parse(`<div/> \n <div/> \n <div/>`);
      expect(ast.children.length).toBe(3);
      expect(ast.children[1].type).toBe(NodeTypes.ELEMENT);
    });

    it('should NOT remove whitespaces w/ newline between interpolations', () => {
      const ast = parse(`{{ foo }} \n {{ bar }}`);
      expect(ast.children.length).toBe(3);
      expect(ast.children[0].type).toBe(NodeTypes.INTERPOLATION);
      expect(ast.children[1]).toMatchObject({
        type: NodeTypes.TEXT,
        content: ' ',
      });
      expect(ast.children[2].type).toBe(NodeTypes.INTERPOLATION);
    });

    it('should NOT remove whitespaces w/o newline between elements', () => {
      const ast = parse(`<div/> <div/> <div/>`);
      expect(ast.children.length).toBe(5);
      expect(ast.children.map((c) => c.type)).toMatchObject([
        NodeTypes.ELEMENT,
        NodeTypes.TEXT,
        NodeTypes.ELEMENT,
        NodeTypes.TEXT,
        NodeTypes.ELEMENT,
      ]);
    });

    it('should condense consecutive whitespaces in text', () => {
      const ast = parse(`   foo  \n    bar     baz     `);
      expect(ast.children[0].content).toBe(` foo bar baz `);
    });
  });
});
