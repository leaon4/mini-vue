import { effect } from "../effect";
import { reactive } from "../reactive";

describe('reactive', () => {
    test('isReactive', () => {
        const original = { count: 0 };
        const observed = reactive(original);
        // @ts-ignore
        expect(original.__isReactive).toBe(undefined);
        expect(observed.__isReactive).toBe(true);
    });
    test('子对象也会被代理', () => {
        const original = { obj: { count: 0 } };
        const observed = reactive(original);
        expect(observed.obj.__isReactive).toBe(true);
    });
    test('不会被代理两次', () => {
        const original = { count: 0 };
        const observed = reactive(original);
        const observed2 = reactive(observed);
        expect(observed).toBe(observed2);
    });
    test('重复设置会返回相同值', () => {
        const original = { count: 0 };
        const observed = reactive(original);
        const observed2 = reactive(original);
        expect(observed).toBe(observed2);
    });
})

describe('effect', () => {
    test('basic', () => {
        const observed = reactive({ count: 0 });
        let value;
        effect(() => {
            value = observed.count;
        });
        expect(value).toBe(0);
        observed.count++;
        expect(value).toBe(1);
        observed.count = 10;
        expect(value).toBe(10);
    });
});
