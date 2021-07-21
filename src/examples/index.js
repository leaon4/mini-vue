const { createApp, ref } = MiniVue;


createApp({
    setup() {
        const counter = ref(0)
        const click = () => counter.value++
        return {
            counter,
            click
        }
    }
}).mount('#app')
