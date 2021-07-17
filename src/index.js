import { baseCompile as compile } from './compiler/compile'
import { render, h } from './runtime'

const root = document.getElementById('template')
let template = root.innerHTML;
root.textContent = template;

const result = compile(template.trim());

console.log(result)

document.getElementById('codes').innerHTML = result;

// render(h('div', null, []), root)

