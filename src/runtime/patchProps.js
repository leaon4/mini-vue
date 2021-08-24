import { isBoolean } from '../utils';

const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
export function patchProps(oldProps, newProps, el) {
  if (oldProps === newProps) {
    return;
  }
  newProps = newProps || {};
  oldProps = oldProps || {};
  for (const key in newProps) {
    if (key === 'key') {
      continue;
    }
    const next = newProps[key];
    const prev = oldProps[key];
    if (next !== prev) {
      patchDomProp(el, key, prev, next);
    }
  }
  for (const key in oldProps) {
    if (key !== 'key' && newProps[key] == null) {
      patchDomProp(el, key, oldProps[key], null);
    }
  }
}

function patchDomProp(el, key, prev, next) {
  switch (key) {
    case 'class':
      // next可能为null，会变成'null'，因此要设成''
      el.className = next || '';
      break;
    case 'style':
      if (!next) {
        el.removeAttribute('style');
      } else {
        for (const styleName in next) {
          el.style[styleName] = next[styleName];
        }
        if (prev) {
          for (const styleName in prev) {
            if (next[styleName] == null) {
              el.style[styleName] = '';
            }
          }
        }
      }
      break;
    default:
      if (/^on[^a-z]/.test(key)) {
        const eventName = key.slice(2).toLowerCase();
        if (prev) {
          el.removeEventListener(eventName, prev);
        }
        if (next) {
          el.addEventListener(eventName, next);
        }
      } else if (domPropsRE.test(key)) {
        // {'checked': ''}
        if (next === '' && isBoolean(el[key])) {
          next = true;
        }
        el[key] = next;
      } else {
        // attr
        if (next == null || next === false) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, next);
        }
      }
      break;
  }
}
