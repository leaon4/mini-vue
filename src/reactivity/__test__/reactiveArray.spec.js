import { effect } from '../effect';
import { isReactive, reactive } from '../reactive';
import { ref, isRef } from '../ref';
describe('reactive array', () => {
  test('响应式数组', () => {
    const original = [{ foo: 1 }];
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReactive(observed[0])).toBe(true);
    // get
    expect(observed[0].foo).toBe(1);
    // has
    expect(0 in observed).toBe(true);
    // ownKeys
    expect(Object.keys(observed)).toEqual(['0']);
  });

  test('数组元素能正常响应', () => {
    const observed = reactive([]);
    let dummy, length;
    effect(() => {
      dummy = observed[3];
      length = observed.length;
    });
    expect(dummy).toBeUndefined();
    expect(length).toBe(0);

    observed[3] = 3;
    expect(dummy).toBe(3);
    expect(length).toBe(4);

    observed[3] = { count: 0 };
    expect(isReactive(dummy)).toBe(true);
    expect(dummy.count).toBe(0);

    observed.length = 0;
    expect(dummy).toBe(undefined);
    expect(length).toBe(0);
  });

  test('push', () => {
    const observed = reactive([]);
    let dummy, length;
    effect(() => {
      dummy = observed[3];
      length = observed.length;
    });
    observed.push(1);
    expect(dummy).toBeUndefined();
    expect(length).toBe(1);
  });

  test('数组元素能正常响应2', () => {
    const original = [];
    const observed = reactive(original);
    let dummy;
    effect(() => {
      dummy = observed[3];
    });
    expect(dummy).toBeUndefined();
    observed[3] = 3;
    expect(dummy).toBe(3);
    observed[3] = { count: 0 };
    expect(isReactive(dummy)).toBe(true);
    expect(dummy.count).toBe(0);
  });

  test('cloned reactive Array should point to observed values', () => {
    const original = [{ foo: 1 }];
    const observed = reactive(original);
    const clone = observed.slice();
    expect(isReactive(clone[0])).toBe(true);
    expect(clone[0]).not.toBe(original[0]);
    expect(clone[0]).toBe(observed[0]);
  });

  test('observed value should proxy mutations to original (Array)', () => {
    const original = [{ foo: 1 }, { bar: 2 }];
    const observed = reactive(original);
    // set
    const value = { baz: 3 };
    const reactiveValue = reactive(value);
    observed[0] = value;
    expect(observed[0]).toBe(reactiveValue);
    expect(original[0]).toBe(value);
    // delete
    delete observed[0];
    expect(observed[0]).toBeUndefined();
    expect(original[0]).toBeUndefined();
    // mutating methods
    observed.push(value);
    expect(observed[2]).toBe(reactiveValue);
    expect(original[2]).toBe(value);
  });

  /* test('Array identity methods should work with raw values', () => {
        const raw = {}
        const arr = reactive([{}, {}])
        arr.push(raw)
        expect(arr.indexOf(raw)).toBe(2)
        expect(arr.indexOf(raw, 3)).toBe(-1)
        expect(arr.includes(raw)).toBe(true)
        expect(arr.includes(raw, 3)).toBe(false)
        expect(arr.lastIndexOf(raw)).toBe(2)
        expect(arr.lastIndexOf(raw, 1)).toBe(-1)

        // should work also for the observed version
        const observed = arr[2]
        expect(arr.indexOf(observed)).toBe(2)
        expect(arr.indexOf(observed, 3)).toBe(-1)
        expect(arr.includes(observed)).toBe(true)
        expect(arr.includes(observed, 3)).toBe(false)
        expect(arr.lastIndexOf(observed)).toBe(2)
        expect(arr.lastIndexOf(observed, 1)).toBe(-1)
    }) */

  test('length reactive', () => {
    const arr = reactive([]);
    let length;
    effect(() => {
      length = arr.length;
    });
    expect(length).toBe(0);

    arr.push(1);
    expect(length).toBe(1);
    arr[10] = 1;
    expect(length).toBe(11);

    arr.pop();
    expect(length).toBe(10);

    arr.unshift(1);
    expect(length).toBe(11);

    arr.shift();
    expect(length).toBe(10);

    arr.splice(5, 1);
    expect(length).toBe(9);
  });

  test('Array identity methods should work if raw value contains reactive objects', () => {
    const raw = [];
    const obj = reactive({});
    raw.push(obj);
    const arr = reactive(raw);
    expect(arr.includes(obj)).toBe(true);
  });

  test('delete on Array should not trigger length dependency', () => {
    const arr = reactive([1, 2, 3]);
    const fn = jest.fn();
    effect(() => {
      fn(arr.length);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    delete arr[1];
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('add existing index on Array should not trigger length dependency', () => {
    const array = new Array(3);
    const observed = reactive(array);
    const fn = jest.fn();
    effect(() => {
      fn(observed.length);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    observed[1] = 1;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('add non-integer prop on Array should not trigger length dependency', () => {
    const array = new Array(3);
    const observed = reactive(array);
    const fn = jest.fn();
    effect(() => {
      fn(observed.length);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    // @ts-ignore
    observed.x = 'x';
    expect(fn).toHaveBeenCalledTimes(1);
    observed[-1] = 'x';
    expect(fn).toHaveBeenCalledTimes(1);
    observed[NaN] = 'x';
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should observe implicit array length changes', () => {
    let dummy;
    const list = reactive(['Hello']);
    effect(() => (dummy = list.join(' ')));

    expect(dummy).toBe('Hello');
    list[1] = 'World!';
    expect(dummy).toBe('Hello World!');
    list[3] = 'Hello!';
    expect(dummy).toBe('Hello World!  Hello!');
  });

  it('should observe sparse array mutations', () => {
    let dummy;
    const list = reactive([]);
    list[1] = 'World!';
    effect(() => (dummy = list.join(' ')));

    expect(dummy).toBe(' World!');
    list[0] = 'Hello';
    expect(dummy).toBe('Hello World!');
    list.pop();
    expect(dummy).toBe('Hello');
  });

  it('should NOT unwrap ref types nested inside arrays', () => {
    const arr = ref([1, ref(3)]).value;
    expect(isRef(arr[0])).toBe(false);
    expect(isRef(arr[1])).toBe(true);
    expect(arr[1].value).toBe(3);
  });

  /* it('length截断', () => {
        const arr = reactive([1, 2, 3, 4, 5])
        let dummy
        effect(()=>{
            dummy = arr[3];
        })
        expect(dummy).toBe(4)

        arr.length = 1;
        expect(dummy).toBeUndefined()
    }) */

  it('reduce', () => {
    const arr = reactive([1, 2, 3, 4, 5]);
    let dummy;
    effect(() => {
      dummy = arr.reduce((a, b) => a + b);
    });
    expect(dummy).toBe(15);

    arr.push(6);
    expect(dummy).toBe(21);

    arr.shift();
    expect(dummy).toBe(20);

    arr.length = 1;
    expect(dummy).toBe(2);
  });
});
