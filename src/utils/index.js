export function isObject(raw) {
    return typeof raw === 'object' && raw !== null;
}

export function isFunction(raw) {
    return typeof raw === 'function';
}

export function hasChanged(value, oldValue) {
    return value !== oldValue && (value === value || oldValue === oldValue);
}
