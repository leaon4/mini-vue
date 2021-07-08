import { render } from "../render";
import { h, Text, Fragment } from '../vnode';

function getTag(el) {
    return el.tagName.toLowerCase();
}

describe('patch props', () => {
    test('patch class', () => {
        let el;
        const root = document.createElement('div')
        render(h('div'), root)
        el = root.children[0]
        expect(el.className).toBeFalsy()

        render(h('div', {}), root)
        el = root.children[0]
        expect(el.className).toBeFalsy()

        render(h('div', { class: '' }), root)
        el = root.children[0]
        expect(el.className).toBe('')

        render(h('div', { class: 'a' }), root)
        el = root.children[0]
        expect(el.className).toBe('a')

        render(h('div', { class: 'b' }), root)
        el = root.children[0]
        expect(el.className).toBe('b')

        render(h('div'), root)
        el = root.children[0]
        expect(el.className).toBeFalsy()
    })

    test('patch style', () => {
        let el;
        const root = document.createElement('div')
        render(h('div'), root)
        el = root.children[0]
        expect(el.style.color).toBeFalsy()

        render(h('div', {
            style: { color: 'red' }
        }), root)
        el = root.children[0]
        expect(el.style.color).toBe('red')

        render(h('div', {
            style: {
                color: 'blue',
                border: '1px solid',
                fontSize: '12px'
            }
        }), root)
        el = root.children[0]
        expect(el.style.color).toBe('blue')
        expect(el.style.border).toBe('1px solid')
        expect(el.style.fontSize).toBe('12px')

        render(h('div', {
            style: {
                color: 'yellow',
            }
        }), root)
        el = root.children[0]
        expect(el.style.color).toBe('yellow')
        expect(el.style.border).toBeFalsy()
        expect(el.style.fontSize).toBeFalsy()

        render(h('div'), root)
        el = root.children[0]
        expect(el.style.color).toBeFalsy()
        expect(el.getAttribute('style')).toBeFalsy()
    })

    test('patch props and attrs', () => {
        let el;
        const root = document.createElement('div')
        render(h('div'), root)
        el = root.children[0]
        expect(el.id).toBeFalsy()
        expect(el.getAttribute('foo')).toBeFalsy()

        render(h('div', { id: 'a', foo: 'foo' }), root)
        el = root.children[0]
        expect(el.id).toBe('a')
        expect(el.getAttribute('foo')).toBe('foo')

        render(h('div', { id: 'b', bar: 'bar' }), root)
        el = root.children[0]
        expect(el.id).toBe('b')
        expect(el.getAttribute('foo')).toBeFalsy()
        expect(el.getAttribute('bar')).toBe('bar')

        render(h('div'), root)
        el = root.children[0]
        expect(el.id).toBeFalsy()
        expect(el.getAttribute('foo')).toBeFalsy()
        expect(el.getAttribute('bar')).toBeFalsy()
    })

    test('patch event', () => {
        let el, dummy = 0;
        const root = document.createElement('div')
        render(h('div', { onClick: () => dummy++ }), root)
        el = root.children[0]
        el.click()
        expect(dummy).toBe(1)

        // 事件不会被绑定两次
        render(h('div', { onClick: () => dummy++ }), root)
        el = root.children[0]
        el.click()
        expect(dummy).toBe(2)

        const triggerMousedown = () => {
            const event = new Event('mousedown')
            el.dispatchEvent(event)
        };

        render(h('div', { onMousedown: () => dummy += 10 }), root)
        el = root.children[0]
        el.click()
        expect(dummy).toBe(2)
        triggerMousedown();
        expect(dummy).toBe(12)

        render(h('div'), root)
        el = root.children[0]
        el.click()
        triggerMousedown();
        expect(dummy).toBe(12)
    })
})
