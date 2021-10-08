import { compile } from './compiler/compile';
import {
  createApp,
  render,
  h,
  Text,
  Fragment,
  nextTick,
} from './runtime';
import { reactive, ref, computed, effect } from './reactivity';

export const MiniVue = (window.MiniVue = {
  createApp,
  render,
  h,
  Text,
  Fragment,
  nextTick,
  reactive,
  ref,
  computed,
  effect,
  compile,
});
