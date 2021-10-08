import { hasChanged, isArray, isObject } from '../utils';
import { track, trigger } from './effect';

const proxyMap = new WeakMap();
export function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (isReactive(target)) {
    return target;
  }
  if (proxyMap.has(target)) {
    return proxyMap.get(target);
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === '__isReactive') {
        return true;
      }
      const res = Reflect.get(target, key, receiver);
      track(target, key);
      return isObject(res) ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      let oldLength = target.length;
      const oldValue = target[key];
      const res = Reflect.set(target, key, value, receiver);
      if (hasChanged(oldValue, value)) {
        trigger(target, key);
        if (isArray(target) && hasChanged(oldLength, target.length)) {
          trigger(target, 'length');
        }
      }
      return res;
    },
  });

  proxyMap.set(target, proxy);

  return proxy;
}

export function isReactive(target) {
  return !!(target && target.__isReactive);
}
