import { baseCompile as compile } from "./compiler/compile";
import { createApp, render, h, Text, Fragment, renderList, resolveComponent, withModel } from "./runtime";
import { reactive, ref, computed, effect } from './reactivity';

window.MiniVue = {
    createApp,
    render,
    h,
    Text,
    Fragment,
    renderList,
    resolveComponent,
    withModel,
    reactive,
    ref,
    computed,
    effect,
};
