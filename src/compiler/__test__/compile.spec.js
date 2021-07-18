import { h } from '../../runtime'
import { NodeTypes, ElementTypes } from '../ast'
import { baseCompile } from '../compile'


describe('compiler: integration tests', () => {
    describe('text and interpolation', () => {
        test('simple text', () => {
            const code = baseCompile('foo');
            expect(code).toBe('h(Text, null, "foo")');
        })

        test('no consecutive text', () => {
            const code = baseCompile('{{ foo }}');
            expect(code).toBe('h(Text, null, foo)');
        })

        test('expression', () => {
            const code = baseCompile('{{ foo + bar }}');
            expect(code).toBe('h(Text, null, foo + bar)');
        })

        test('consecutive text', () => {
            const code = baseCompile('{{ foo }} bar {{ baz }}');
            expect(code).toBe('[h(Text, null, foo), h(Text, null, " bar "), h(Text, null, baz)]');
        })

        test('consecutive text between elements', () => {
            const code = baseCompile('<div/>{{ foo }} bar {{ baz }}<div/>');
            expect(code).toBe('[h("div"), h(Text, null, foo), h(Text, null, " bar "), h(Text, null, baz), h("div")]');
        })

        test('text between elements (static)', () => {
            const code = baseCompile('<div/>hello<div/>');
            expect(code).toBe('[h("div"), h(Text, null, "hello"), h("div")]');
        })

        test('consecutive text mixed with elements', () => {
            const code = baseCompile('<div/>{{ foo }} bar {{ baz }}<div/>hello<div/>');
            expect(code).toBe('[h("div"), h(Text, null, foo), h(Text, null, " bar "), '
                + 'h(Text, null, baz), h("div"), h(Text, null, "hello"), h("div")]');
        })
    })

    describe('element', () => {
        test('single element', () => {
            const code = baseCompile('<p/>');
            expect(code).toBe('h("p")');
        })

        test('with text child', () => {
            const code = baseCompile('<div>fine</div>');
            expect(code).toBe('h("div", null, "fine")');
        })

        // test('import + resolve component', () => {
        //     const code = baseCompile('<Foo/>');
        //     expect(code).toBe('h("Foo")');
        // })

    })

    describe('v-if', () => {
        test('basic v-if', () => {
            const code = baseCompile('<div v-if="ok"/>');
            expect(code).toBe('ok ? h("div") : h(Text, null, "")');
        })

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
            const code = baseCompile('<div v-if="ok"/><p v-else/>');
            expect(code).toBe('ok ? h("div") : h("p")');
        })

        test('v-if + v-else-if', () => {
            const code = baseCompile('<div v-if="ok"/><p v-else-if="orNot"/>');
            expect(code).toBe('ok ? h("div") : orNot ? h("p") : h(Text, null, "")');
        })

        test('v-if + v-else-if + v-else', () => {
            const code = baseCompile('<div v-if="ok"/><p v-else-if="orNot"/><h1 v-else>fine</h1>');
            expect(code).toBe('ok ? h("div") : orNot ? h("p") : h("h1", null, "fine")');
        })

        test('with spaces between branches', () => {
            const code = baseCompile('<div v-if="ok"/> <p v-else-if="no"/> <span v-else/>');
            expect(code).toBe('ok ? h("div") : no ? h("p") : h("span")');
        })

        test('nested', () => {
            const code = baseCompile(`
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
            `.trim());

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
            expect(code).toBe('ok ? h("div", null, "ok") : foo ? h("div", null, [a ? h("h1") : b ? h("h2") : h(Text, null, ""), c ? h("h3") : d ? h("h4") : e ? h("h5") : h("h6", null, [h("div", null, "hello world")])]) : h("span")')
        })
    })

    describe('v-for', () => {

    })
})

function creatTextCode(content) {
    return `h(Text, null, ${content})`
}
