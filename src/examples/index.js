
const { createApp, ref, reactive } = MiniVue;

const child = {
    name: 'Child',
    template: document.getElementById('item-template').innerHTML,
    setup() {
        const text = ref('text');
        const model = reactive({
            radio: 'second'
        })
        return {
            text,
            model
        }
    }
}

createApp({
    components: {
        child,
    },
    setup() {
        const counter = ref(0)
        const click = () => counter.value++
        return {
            counter,
            click
        }
    }
}).mount('#app')
function aa(params) {
    alert(5)
}
