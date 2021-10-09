import { effect } from '../effect';
import { isRef, ref } from '../ref';

describe('ref', () => {
  test('isRef', () => {
    let r = undefined;
    expect(isRef(r)).toBe(false);
    r = ref(null);
    expect(isRef(r)).toBe(true);
  });

  test('basic use', () => {
    const r = ref(0);
    let dummy;
    effect(() => {
      dummy = r.value;
    });
    expect(dummy).toBe(0);
    r.value++;
    expect(dummy).toBe(1);
  });

  test('有多个ref', () => {
    const r1 = ref(0);
    const r2 = ref(10);
    let dummy;
    effect(() => {
      dummy = r1.value + r2.value;
    });
    expect(dummy).toBe(10);
    r1.value++;
    expect(dummy).toBe(11);
    r2.value = 20;
    expect(dummy).toBe(21);
  });

  test('ref值为对象', () => {
    const r = ref({ count: 0 });
    let dummy;
    expect(r.value.count).toBe(0);
    effect(() => {
      dummy = r.value.count;
    });
    expect(dummy).toBe(0);
    r.value.count++;
    expect(dummy).toBe(1);
  });

  test('重赋ref', () => {
    const r1 = ref();
    const r2 = ref(r1);
    expect(r2).toBe(r1);
  });
});
