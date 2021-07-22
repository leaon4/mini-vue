const { createApp, ref } = MiniVue;

const child = {
    name: 'Child',
    template: document.getElementById('item-template').innerHTML,
    setup() {
        const model = ref('text')
        return {
            model,
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
