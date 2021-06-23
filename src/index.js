import { reactive } from './reactivity/reactive';
import { effect } from "./reactivity/effect";

const observed = window.observed = reactive({ count: 0 })
effect(() => {
    console.log('observed.count = ', observed.count);
});
