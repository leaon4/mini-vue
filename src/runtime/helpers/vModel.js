export function withModel(tag, props, getter, setter) {
    props = props || {}
    if (tag === 'input') {
        switch (props.type) {
            case 'radio':

                break;

            default:
                // 'input'
                props.value = getter();
                props.onInput = setter;
                break;
        }
    }
    return props;
}
