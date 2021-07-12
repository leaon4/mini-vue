import { render } from "../render";
import { h, Text, Fragment } from '../vnode';

let root;
beforeEach(() => {
    root = document.createElement('div');
});

describe('renderer: component', () => {
    /* test('should update parent(hoc) component host el when child component self update', async () => {
        const value = ref(true)
        let parentVnode
        let childVnode1
        let childVnode2

        const Parent = {
            render: () => {
                // let Parent first rerender
                return (parentVnode = h(Child))
            }
        }

        const Child = {
            render: () => {
                return value.value
                    ? (childVnode1 = h('div'))
                    : (childVnode2 = h('span'))
            }
        }

        const root = nodeOps.createElement('div')
        render(h(Parent), root)
        expect(serializeInner(root)).toBe(`<div></div>`)
        expect(parentVnode!.el).toBe(childVnode1!.el)

        value.value = false
        await nextTick()
        expect(serializeInner(root)).toBe(`<span></span>`)
        expect(parentVnode!.el).toBe(childVnode2!.el)
    }) */

    it('should create an Component with props', () => {
        const Comp = {
            render: () => {
                return h('div')
            }
        }
        render(h(Comp, { id: 'foo', class: 'bar' }), root)
        expect(root.innerHTML).toBe(`<div id="foo" class="bar"></div>`)
    })

    it('should create an Component with direct text children', () => {
        const Comp = {
            render: () => {
                return h('div', null, 'test')
            }
        }
        render(h(Comp, { id: 'foo', class: 'bar' }), root)
        expect(root.innerHTML).toBe(`<div id="foo" class="bar">test</div>`)
    })

    // it('should update an Component tag which is already mounted', () => {
    //     const Comp1 = {
    //         render: () => {
    //             return h('div', null, 'foo')
    //         }
    //     }
    //     render(h(Comp1), root)
    //     expect(root.innerHTML).toBe('<div>foo</div>')

    //     const Comp2 = {
    //         render: () => {
    //             return h('span', null, 'foo')
    //         }
    //     }
    //     render(h(Comp2), root)
    //     expect(root.innerHTML).toBe('<span>foo</span>')
    // })
})
