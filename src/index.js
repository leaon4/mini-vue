import { effect, ref, reactive } from "./reactivity";
import { h, render } from './runtime';

const Comp = {
    setup() {
        const counter = ref(0);
        const click = () => {
            counter.value++;
        }
        return {
            counter,
            click
        }
    },
    render(ctx) {
        return [
            h('div', null, `counter is: ${ctx.counter.value}`),
            h('button', { onClick: ctx.click }, 'click')
        ];
    }
}
render(h(Comp), document.body)
