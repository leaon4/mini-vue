import { effect } from "../effect";
import { reactive } from "../reactive";

describe('reactive', () => {
    test('isReactive', () => {
        const original = { count: 0 };
        const observed = reactive(original);
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
    test('basic use', () => {
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

    test('有多个effect', () => {
        const observed = reactive({ count: 0 });
        let value1;
        effect(() => {
            value1 = observed.count;
        });
        let value2;
        effect(() => {
            value2 = observed.count;
        });
        let value3;
        effect(() => {
            value3 = observed.count;
        });
        expect(value1).toBe(0);
        expect(value2).toBe(0);
        expect(value3).toBe(0);
        observed.count++;
        expect(value1).toBe(1);
        expect(value2).toBe(1);
        expect(value3).toBe(1);
    });

    test('effect中监听多个响应式对象', () => {
        const observed1 = reactive({ count: 0 });
        const observed2 = reactive({ count: 0 });
        let value;
        effect(() => {
            value = observed1.count + observed2.count;
        });
        expect(value).toBe(0);
        observed1.count++;
        expect(value).toBe(1);
        observed2.count++;
        expect(value).toBe(2);
        observed1.count++;
        observed2.count++;
        expect(value).toBe(4);
    });

    test('嵌套响应式对象', () => {
        let value
        const observed = reactive({ nested: { num: 0 } })
        effect(() => (value = observed.nested.num))

        expect(value).toBe(0)
        observed.nested.num = 8
        expect(value).toBe(8)
    });

    test('新添加的属性也会被代理', () => {
        let value;
        const original = { count: 0 };
        const observed = reactive(original);
        effect(() => {
            value = observed.anotherValue;
        })
        expect(value).toBe(undefined);
        observed.anotherValue = 1;
        expect(value).toBe(1);
    });
});
