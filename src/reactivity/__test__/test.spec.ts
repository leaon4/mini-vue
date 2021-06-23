import { reactive } from "../index";

describe('测试 reactive', () => {
    test('basic use', () => {
        expect(reactive(1)).toBe(true);
    })
})
