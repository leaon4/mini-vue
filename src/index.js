import { reactive } from './reactivity/reactive';
import { effect } from "./reactivity/effect";

const observed = window.observed = reactive({ count: 0 })
effect(() => {
    console.log('observed.count = ', observed.count);
});


console.log(getSequence([3, 2, 1, 4]), 2)
console.log(getSequence([10, 9, 2, 5, 3, 7, 101, 18]), 4)
console.log(getSequence([10, 9, 2, 5, 3, 4, 7, 101, 18]), 5)
console.log(getSequence([0, 1, 0, 3, 2, 3]), 4)
console.log(getSequence([7, 7, 7, 7, 7]), 1)
console.log(getSequence([4, 10, 4, 3, 8, 9]), 3)
console.log(getSequence([3, 5, 6, 2, 5, 4, 19, 5, 6, 7, 12]), 6)
console.log(getSequence([3, 5, 6, 2, 5, 4]), 3)
console.log('----')
console.log(lengthOfLIS([3, 2, 1, 4]), 2)
console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]), 4)
console.log(lengthOfLIS([10, 9, 2, 5, 3, 4, 7, 101, 18]), 5)
console.log(lengthOfLIS([0, 1, 0, 3, 2, 3]), 4)
console.log(lengthOfLIS([7, 7, 7, 7, 7]), 1)
console.log(lengthOfLIS([4, 10, 4, 3, 8, 9]), 3)
console.log(lengthOfLIS([3, 5, 6, 2, 5, 4, 19, 5, 6, 7, 12]), 6)
console.log(lengthOfLIS([3, 5, 6, 2, 5, 4]), 3)
console.log(lengthOfLIS([-1, -1, 3, 2, -1, -1, 1, -1, 4, -1, -1]), 2)

function lengthOfLIS(nums) {
    let result = [];
    let position = []
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] === -1) {
            continue;
        }
        // result[result.length - 1]可能为undefined，此时nums[i] > undefined为false
        if (nums[i] > result[result.length - 1]) {
            result.push(nums[i]);
            position.push(result.length - 1)
        } else {
            let l = 0, r = result.length - 1;
            while (l <= r) {
                let mid = ~~((l + r) / 2);
                if (nums[i] > result[mid]) {
                    l = mid + 1;
                } else if (nums[i] < result[mid]) {
                    r = mid - 1;
                } else {
                    l = mid;
                    break;
                }
            }
            result[l] = nums[i]
            position.push(l)
        }
    }
    let cur = result.length - 1;
    for (let i = position.length; i >= 0 && cur >= 0; i--) {
        if (position[i] === cur) {
            result[cur--] = i;
        }
    }
    return result;
};

function getSequence(arr) {
    // slice并不是为了复制，而只是为了得到一个同样长度的数组
    // 其内容记录的是下标
    const something = arr.slice()
    const result = [0] // 这个result也是记录最长子序列的。不同的是它记录的是下标
    let i, j, l, r, mid
    const len2 = arr.length
    // 10, 9, 2, 5, 3, 7, 101, 18
    // 1,2,3,4,5
    for (i = 0; i < len2; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {
            j = result[result.length - 1]
            if (arrI > arr[j]) {
                something[i] = j
                result.push(i)
                continue
            }
            l = 0
            r = result.length - 1
            while (l < r) {
                mid = ((l + r) / 2) | 0
                if (arr[result[mid]] < arrI) {
                    l = mid + 1
                } else {
                    r = mid
                }
            }
            if (arrI < arr[result[l]]) {
                if (l > 0) {
                    something[i] = result[l - 1]
                }
                result[l] = i
            }
        }
    }
    let len = result.length
    let cur = result[len - 1]
    while (len-- > 0) {
        result[len] = cur
        cur = something[cur]
    }
    return result
}
