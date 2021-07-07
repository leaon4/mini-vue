import { render } from "../render";
import { h, Text, Fragment } from '../vnode';

function getTag(el) {
    return el.tagName.toLowerCase();
}

describe('unmount from root', () => {
    test('unmount element', () => {
        const root = document.createElement('div')
        render(h('div'), root)
        expect(root.children.length).toBe(1)

        render(null, root)
        expect(root.children.length).toBe(0)
    })

    test('unmount text node', () => {
        const root = document.createElement('div')
        render(h(Text, null, 'hello world!'), root)
        expect(root.firstChild.textContent).toBe('hello world!')

        render(null, root)
        expect(root.firstChild).toBeFalsy()
    })

    test('unmount fragment', () => {
        const root = document.createElement('div')
        render(h(Fragment, null, [
            h(Text, null, 'hello world!'),
            h('div'),
            h('h1')
        ]), root)
        expect(root.childNodes[1].textContent).toBe('hello world!')
        const { children } = root;
        expect(getTag(children[0])).toBe('div')
        expect(children.length).toBe(2)

        render(null, root)
        expect(root.childNodes.length).toBe(0)
    })
})
