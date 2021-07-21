import { baseCompile as compile } from "./compiler/compile";
import { createApp, render, h, Text, Fragment, renderList, resolveComponent } from "./runtime";
import { reactive, ref, computed, effect } from './reactivity';

window.MiniVue = {
    createApp,
    render,
    h,
    Text,
    Fragment,
    renderList,
    resolveComponent,
    reactive,
    ref,
    computed,
    effect
};
