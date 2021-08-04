// import { reactive } from './reacitve/reactive';
// import { effect } from './reacitve/effect';
import { ref } from './reacitve/ref';
import { computed } from './reacitve/computed';

const num = (window.num = ref(0));
const c = (window.c = computed({
  get() {
    console.log('get')
    return num.value * 2;
  },
  set(newVal) {
    num.value = newVal;
  },
}));
