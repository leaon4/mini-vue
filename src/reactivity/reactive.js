import { isObject, hasChanged, isArray } from '../utils';
import { track, trigger } from './effect';

const reactiveMap = new WeakMap();

export function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (isReactive(target)) {
    return target;
  }
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === '__isReactive') {
        return true;
      }
      track(target, key);
      const res = Reflect.get(target, key, receiver);
      return isObject(res) ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const oldLength = target.length;
      const res = Reflect.set(target, key, value, receiver);
      if (hasChanged(value, oldValue)) {
        trigger(target, key);
        if (isArray(target) && target.length !== oldLength) {
          trigger(target, 'length');
        }
      }
      return res;
    },
  });
  reactiveMap.set(target, proxy);
  return proxy;
}

export function isReactive(target) {
  return !!(target && target.__isReactive);
}
