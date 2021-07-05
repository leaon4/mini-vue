import { track, trigger, effect } from './effect';

export function computed(getter) {
    return new ComputedRefImpl(getter);
}

class ComputedRefImpl {
    constructor(getter) {
        this._value = undefined;
        this._dirty = true;
        this.effect = effect(getter, {
            lazy: true,
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true;
                    trigger(this, 'value');
                }
            }
        })
    }

    get value() {
        if (this._dirty) {
            this._value = this.effect();
            this._dirty = false;
            track(this, 'value');
        }
        return this._value;
    }

    set value(val) {
        console.warn('computed value is readonly');
    }
}
