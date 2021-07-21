const { createApp, ref } = MiniVue;

const child = {
    name: 'Child',
    template: document.getElementById('item-template').innerHTML,
    setup() {
        return {
            text: 'i am child component'
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
