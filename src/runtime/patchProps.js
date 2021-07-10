export function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps) {
        return;
    }
    oldProps = oldProps || {};
    newProps = newProps || {};
    for (const key in newProps) {
        if (key === 'key') {
            continue;
        }
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
            patchDomProp(el, key, prev, next)
        }
    }
    for (const key in oldProps) {
        if (key !== 'key' && !(key in newProps)) {
            patchDomProp(el, key, oldProps[key], null)
        }
    }
}

const domPropsRE = /[A-Z]|^(value|checked|selected|muted)$/;
function patchDomProp(el, key, prev, next) {
    switch (key) {
        case 'class':
            // 暂时认为class就是字符串
            el.className = next || '';
            break;
        case 'style':
            // style为对象
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
            if (key.startsWith('on')) {
                // 事件
                if (prev !== next) {
                    const eventName = key.slice(2).toLowerCase();
                    if (prev) {
                        el.removeEventListener(eventName, prev);
                    }
                    if (next) {
                        el.addEventListener(eventName, next);
                    }
                }
            } else if (domPropsRE.test(key)) {
                el[key] = next;
            } else {
                if (next == null) {
                    el.removeAttribute(key)
                } else {
                    el.setAttribute(key, next);
                }
            }
            break;
    }
}
