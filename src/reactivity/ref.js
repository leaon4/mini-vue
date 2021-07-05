import { hasChanged, isObject } from '../utils';
import { track, trigger } from './effect';
import { reactive } from './reactive';

export function ref(value) {
    if (isRef(value)) {
        return value;
    }
    return new RefImpl(value);
}

function isRef(value) {
    return !!(value && value.__isRef);
}

class RefImpl {
    constructor(value) {
        this._value = convert(value);
    }

    get value() {
        track(this, 'value');
        return this._value;
    }

    set value(val) {
        if (hasChanged(val, this._value)) {
            trigger(this, 'value');
            this._value = convert(val);
        }
    }
}

function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
