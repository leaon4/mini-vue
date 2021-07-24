import { MiniVue } from '../index'
const { createApp, reactive, nextTick } = MiniVue;

let root;
beforeEach(() => {
    root = document.createElement('div');
});

describe('v-model', () => {
    test('input[type = text]', async () => {
        const template = `
            <div>{{model.text}}</div>
            <input v-model="model.text" />
        `;
        const model = reactive({
            text: 'text'
        });
        createApp({
            template: template.trim(),
            setup() {
                return {
                    model
                }
            }
        }).mount(root);
        const [div, input] = root.children;
        expect(div.textContent).toBe('text')
        expect(input.value).toBe('text')

        const e = new Event('input')
        input.value = 'tex'
        input.dispatchEvent(e);
        await nextTick()
        expect(div.textContent).toBe('tex')

        model.text = 'te'
        await nextTick()
        expect(input.value).toBe('te')
    })

    test('input[type = radio]', async () => {
        const template = `
            <div>{{model.radio}}</div>
            <input name="radio" type="radio" value="first" v-model="model.radio" />
            <input name="radio" type="radio" value="second" v-model="model.radio" />
        `;
        const model = reactive({
            radio: 'second'
        });
        createApp({
            template: template.trim(),
            setup() {
                return {
                    model
                }
            }
        }).mount(root);
        const [div, r1, r2] = root.children;
        expect(div.textContent).toBe('second')
        expect(r1.checked).toBe(false)
        expect(r2.checked).toBe(true)

        r1.click()
        // 真实web中，直接click有效，但在这里必须要补个dispatchEvent
        const e = new Event('change')
        r1.dispatchEvent(e);
        await nextTick()
        expect(div.textContent).toBe('first')
        expect(r1.checked).toBe(true)
        expect(r2.checked).toBe(false)

        model.radio = 'second'
        await nextTick()
        expect(div.textContent).toBe('second')
        expect(r1.checked).toBe(false)
        expect(r2.checked).toBe(true)
    })

    test('input[type = checkbox]', async () => {
        const template = `
            <div>{{model.checkbox.toString()}}</div>
            <input name="checkbox" type="checkbox" value="one" v-model="model.checkbox" />
            <input name="checkbox" type="checkbox" value="two" v-model="model.checkbox" />
            <input name="checkbox" type="checkbox" value="three" v-model="model.checkbox" />
        `;
        const model = reactive({
            checkbox: ['two']
        });
        createApp({
            template: template.trim(),
            setup() {
                return {
                    model
                }
            }
        }).mount(root);
        const [div, c1, c2, c3] = root.children;
        expect(div.textContent).toBe('two')
        expect(c1.checked).toBe(false)
        expect(c2.checked).toBe(true)
        expect(c3.checked).toBe(false)

        c2.click()
        // 真实web中，直接click有效，但在这里必须要补个dispatchEvent
        const e = new Event('change')
        c2.dispatchEvent(e);
        await nextTick()
        expect(div.textContent).toBe('')
        expect(c1.checked).toBe(false)
        expect(c2.checked).toBe(false)
        expect(c3.checked).toBe(false)

        c1.click()
        c3.click()
        // 真实web中，直接click有效，但在这里必须要补个dispatchEvent
        // const e = new Event('change')
        c1.dispatchEvent(e);
        c3.dispatchEvent(e);
        await nextTick()
        expect(div.textContent).toBe('one,three')
        expect(c1.checked).toBe(true)
        expect(c2.checked).toBe(false)
        expect(c3.checked).toBe(true)

        model.checkbox.push('two')
        await nextTick()
        expect(div.textContent).toBe('one,three,two')
        expect(c1.checked).toBe(true)
        expect(c2.checked).toBe(true)
        expect(c3.checked).toBe(true)

        model.checkbox = ['one']
        await nextTick()
        expect(div.textContent).toBe('one')
        expect(c1.checked).toBe(true)
        expect(c2.checked).toBe(false)
        expect(c3.checked).toBe(false)
    })
})
