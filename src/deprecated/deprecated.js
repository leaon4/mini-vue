// 原始版本
function patchKeyedChildren(c1, c2, container, anchor) {
    let lastIndex = 0;
    for (let i = 0; i < c2.length; i++) {
        const next = c2[i];
        let find = false;
        for (let j = 0; j < c1.length; j++) {
            const prev = c1[j];
            if (prev.key === next.key) {
                find = true;
                patch(prev, next, container, anchor);
                if (j < lastIndex) {
                    const curAnchor = c2[i - 1].el.nextSibling;
                    container.insertBefore(next.el, curAnchor);
                } else {
                    lastIndex = j;
                }
                break;
            }
        }
        if (!find) {
            const curAnchor = i === 0
                ? c1[0].el
                : c2[i - 1].el.nextSibling;
            patch(null, next, container, curAnchor)
        }
    }
    for (let i = 0; i < c1.length; i++) {
        const prev = c1[i];
        if (!c2.find(next => next.key === prev.key)) {
            unmount(prev);
        }
    }
}


// 这个版本可以兼容没有key的情况。但没有意义
function patchKeyedChildren(c1, c2, container, anchor) {
    let lastIndex = 0;
    for (let i = 0; i < c2.length; i++) {
        const next = c2[i];
        if (next.key == null) {
            const curAnchor = i === 0
                ? c1[0].el
                : (c2[i - 1].anchor || c2[i - 1].el).nextSibling;
            patch(null, next, container, curAnchor)
            continue;
        }
        let find = false;
        for (let j = 0; j < c1.length; j++) {
            const prev = c1[j];
            if (prev.key == null) {
                continue;
            }
            if (prev.key === next.key) {
                find = true;
                patch(prev, next, container, anchor);
                if (j < lastIndex) {
                    const curAnchor = c2[i - 1].el.nextSibling;
                    container.insertBefore(next.el, curAnchor);
                } else {
                    lastIndex = j;
                }
                break;
            }
        }
        if (!find) {
            const curAnchor = i === 0
                ? c1[0].el
                : (c2[i - 1].anchor || c2[i - 1].el).nextSibling;
            patch(null, next, container, curAnchor)
        }
    }
    for (let i = 0; i < c1.length; i++) {
        const prev = c1[i];
        if (!c2.find(next => next.key && next.key === prev.key)) {
            unmount(prev);
        }
    }
}


// 不用考虑children是fragment的情况，因为fragment没有key
// 而且平级的fragment间也没有上联合diff的必要
// 并假设没有重复key
function patchKeyedChildren(c1, c2, container, anchor) {
    const map = new Map();
    c1.forEach((prev, j) => {
        map.set(prev.key, { prev, j });
    });
    let lastIndex = 0;
    for (let i = 0; i < c2.length; i++) {
        const next = c2[i];
        const curAnchor = i === 0
            ? c1[0].el
            : c2[i - 1].el.nextSibling;
        if (map.has(next.key)) {
            const { prev, j } = map.get(next.key);
            patch(prev, next, container, anchor);
            if (j < lastIndex) {
                container.insertBefore(next.el, curAnchor);
            } else {
                lastIndex = j;
            }
            map.delete(next.key);
        } else {
            patch(null, next, container, curAnchor)
        }
    }
    map.forEach(({ prev }) => {
        if (!c2.find(next => next.key === prev.key)) {
            unmount(prev);
        }
    })
}
