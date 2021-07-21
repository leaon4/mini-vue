import { baseCompile as compile } from "./compiler/compile";
import { createApp, render, h, Text, Fragment, renderList } from "./runtime";
import { reactive, ref, computed, effect } from './reactivity';

window.MiniVue = {
    createApp,
    render,
    h,
    Text,
    Fragment,
    renderList,
    reactive,
    ref,
    computed,
    effect
};
