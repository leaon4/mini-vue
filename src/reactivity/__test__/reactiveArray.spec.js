import { effect } from '../effect'
import { isReactive, reactive } from '../reactive'
describe('reactive array', () => {
    test('响应式数组', () => {
        const original = [{ foo: 1 }]
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
        expect(isReactive(observed[0])).toBe(true)
        // get
        expect(observed[0].foo).toBe(1)
        // has
        expect(0 in observed).toBe(true)
        // ownKeys
        expect(Object.keys(observed)).toEqual(['0'])
    });

    test('数组元素能正常响应', () => {
        const observed = reactive([])
        let dummy, length;
        effect(() => {
            dummy = observed[3];
            length = observed.length;
        })
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

    /* test('push', () => {
        const observed = reactive([]);
        let dummy, length;
        effect(() => {
            dummy = observed[3];
            length = observed.length;
        });
        observed.push(1);
        expect(dummy).toBeUndefined();
        expect(length).toBe(1);
    }); */

    test('数组元素能正常响应', () => {
        const original = []
        const observed = reactive(original)
        let dummy;
        effect(() => {
            dummy = observed[3];
        })
        expect(dummy).toBeUndefined();
        observed[3] = 3;
        expect(dummy).toBe(3);
        observed[3] = { count: 0 };
        expect(isReactive(dummy)).toBe(true);
        expect(dummy.count).toBe(0);
    });

    test('cloned reactive Array should point to observed values', () => {
        const original = [{ foo: 1 }]
        const observed = reactive(original)
        const clone = observed.slice()
        expect(isReactive(clone[0])).toBe(true)
        expect(clone[0]).not.toBe(original[0])
        expect(clone[0]).toBe(observed[0])
    })

    test('observed value should proxy mutations to original (Array)', () => {
        const original = [{ foo: 1 }, { bar: 2 }]
        const observed = reactive(original)
        // set
        const value = { baz: 3 }
        const reactiveValue = reactive(value)
        observed[0] = value
        expect(observed[0]).toBe(reactiveValue)
        expect(original[0]).toBe(value)
        // delete
        delete observed[0]
        expect(observed[0]).toBeUndefined()
        expect(original[0]).toBeUndefined()
        // mutating methods
        observed.push(value)
        expect(observed[2]).toBe(reactiveValue)
        expect(original[2]).toBe(value)
    })

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
});
