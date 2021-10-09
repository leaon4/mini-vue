import { computed } from '../computed';
import { effect } from '../effect';
import { reactive } from '../reactive';
import { ref } from '../ref';

describe('computed', () => {
  test('basic use', () => {
    const observed = reactive({ count: 0 });
    const r = ref(10);
    const c = computed(() => r.value + observed.count);
    expect(c.value).toBe(10);

    observed.count++;
    expect(c.value).toBe(11);
    r.value = 20;
    expect(c.value).toBe(21);
  });

  test('lazy', () => {
    const r = ref(0);
    const getter = jest.fn(() => r.value);
    const c = computed(getter);
    expect(getter).toHaveBeenCalledTimes(0);

    r.value++;
    expect(getter).toHaveBeenCalledTimes(0);

    c.value;
    expect(getter).toHaveBeenCalledTimes(1);
    c.value;
    expect(getter).toHaveBeenCalledTimes(1);

    r.value++;
    r.value++;
    expect(getter).toHaveBeenCalledTimes(1);

    c.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });

  test('能触发effect', () => {
    const value = reactive({ count: 0 });
    const c = computed(() => value.count);
    let dummy;
    effect(() => {
      dummy = c.value;
    });
    expect(dummy).toBe(0);
    value.count = 1;
    expect(dummy).toBe(1);
  });

  test('链式调用', () => {
    const value = reactive({ count: 0 });
    const c1 = computed(() => value.count);
    const c2 = computed(() => c1.value + 1);
    expect(c2.value).toBe(1);
    expect(c1.value).toBe(0);
    value.count++;
    expect(c2.value).toBe(2);
    expect(c1.value).toBe(1);
  });

  test('链式调用', () => {
    const value = reactive({ count: 0 });
    const c1 = computed(() => value.count);
    const c2 = computed(() => c1.value + 1);
    expect(c2.value).toBe(1);
    expect(c1.value).toBe(0);
    value.count++;
    expect(c2.value).toBe(2);
    expect(c1.value).toBe(1);
  });

  it('should trigger effect when chained', () => {
    const value = reactive({ foo: 0 });
    const getter1 = jest.fn(() => value.foo);
    const getter2 = jest.fn(() => {
      return c1.value + 1;
    });
    const c1 = computed(getter1);
    const c2 = computed(getter2);

    let dummy;
    effect(() => {
      dummy = c2.value;
    });
    expect(dummy).toBe(1);
    expect(getter1).toHaveBeenCalledTimes(1);
    expect(getter2).toHaveBeenCalledTimes(1);
    value.foo++;
    expect(dummy).toBe(2);
    // should not result in duplicate calls
    expect(getter1).toHaveBeenCalledTimes(2);
    expect(getter2).toHaveBeenCalledTimes(2);
  });

  it('should support setter', () => {
    const n = ref(1);
    const plusOne = computed({
      get: () => n.value + 1,
      set: (val) => {
        n.value = val - 1;
      },
    });

    expect(plusOne.value).toBe(2);
    n.value++;
    expect(plusOne.value).toBe(3);

    plusOne.value = 0;
    expect(n.value).toBe(-1);
  });

  it('should trigger effect w/ setter', () => {
    const n = ref(1);
    const plusOne = computed({
      get: () => n.value + 1,
      set: (val) => {
        n.value = val - 1;
      },
    });

    let dummy;
    effect(() => {
      dummy = n.value;
    });
    expect(dummy).toBe(1);

    plusOne.value = 0;
    expect(dummy).toBe(-1);
  });
});
