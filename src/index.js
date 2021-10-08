import { parse } from './compiler';

console.log(parse(`<div id="foo" v-if="ok">hello {{name}}</div>`));
