import { NodeTypes } from '../ast';
import { traverseNode as generate } from '../codegen';

function createAst(node) {
  return {
    type: NodeTypes.ROOT,
    children: [node],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    imports: [],
    cached: 0,
    temps: 0,
  };
}

describe('test codegen independent', () => {
  test('type of text', () => {
    const ast = createAst({
      type: NodeTypes.TEXT,
      content: 'foo',
    });
    const code = generate(ast);
    expect(code).toBe('h(Text, null, "foo")');
  });

  test('type of interpolation', () => {
    const ast = createAst({
      type: NodeTypes.INTERPOLATION,
      content: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'foo',
        isStatic: false,
      },
    });
    const code = generate(ast);
    expect(code).toBe('h(Text, null, foo)');
  });
});
