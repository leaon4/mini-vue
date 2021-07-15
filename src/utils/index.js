export function isObject(value) {
    return typeof value === 'object' && value !== null;
}

export function isFunction(value) {
    return typeof value === 'function';
}

export function isArray(value) {
    return Array.isArray(value);
}

export function isString(value) {
    return typeof value === 'string';
}

export function isNumber(value) {
    return typeof value === 'number'
}

export function hasChanged(value, oldValue) {
    return value !== oldValue && (value === value || oldValue === oldValue);
}
