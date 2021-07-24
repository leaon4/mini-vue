export function withModel(tag, props, getter, setter) {
    props = props || {}
    if (tag === 'input') {
        switch (props.type) {
            case 'radio':
                props.checked = getter() === props.value;
                props.onChange = (e) => setter(e.target.value);
                break;
            case 'checkbox':
                props.checked = getter().includes(props.value);
                props.onChange = (e) => {
                    const { value } = e.target;
                    const values = new Set(getter());
                    if (values.has(value)) {
                        values.delete(value);
                    } else {
                        values.add(value);
                    }
                    setter([...values])
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
