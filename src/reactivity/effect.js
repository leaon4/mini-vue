let activeEffect;

export function effect(fn) {
    const effectFn = () => {
        try {
            activeEffect = effectFn;
            return fn();
        } finally {
            activeEffect = undefined;
        }
    }
    effectFn();
    return effectFn;
}


const targetMap = new WeakMap();

export function track(target, key) {
    if (!activeEffect) {
        return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, depsMap = new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, dep = new Set());
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
    }
}

export function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const dep = depsMap.get(key);
    if (!dep) {
        return;
    }
    dep.forEach(effectFn => {
        effectFn();
    });
}
