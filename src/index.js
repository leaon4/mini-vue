import { baseCompile as compile } from "./compiler/compile";
import { createApp, render, h, Text, Fragment, renderList } from "./runtime";
import { reactive, ref } from './reactivity';

window.MiniVue = {
    createApp,
    h,
    Text,
    Fragment,
    renderList
};

// const root = document.getElementById("template");
// let template = root.innerHTML;
// root.textContent = template;

// const result = compile(template.trim());

// console.log(result);

// document.getElementById("codes").innerHTML = result;

// render(h('div', null, []), root)


console.log(1)
createApp({
    setup() {
        const counter = ref(0)
        const click = () => counter.value++
        return {
            counter,
            click
        }
    }
}).mount('#app')
