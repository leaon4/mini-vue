import { isArray } from '../../utils';

export function withModel(tag, props, getter, setter) {
    props = props || {};
    if (tag === 'input') {
        switch (props.type) {
            case 'radio':
                props.checked = getter() === props.value;
                props.onChange = (e) => setter(e.target.value);
                break;
            case 'checkbox':
                const modelValue = getter();
                if (isArray(modelValue)) {
                    props.checked = modelValue.includes(props.value);
                    props.onChange = (e) => {
                        const { value } = e.target;
                        const values = new Set(getter());
                        if (values.has(value)) {
                            values.delete(value);
                        } else {
                            values.add(value);
                        }
                        setter([...values]);
                    };
                } else {
                    props.checked = modelValue;
                    props.onChange = (e) => {
                        setter(e.target.checked);
                    };
                }
                break;
            default:
                // 'input'
                props.value = getter();
                props.onInput = (e) => setter(e.target.value);
                break;
        }
    }
    return props;
}
