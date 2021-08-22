# 核心 diff 算法

所谓**核心 diff 算法**，其实就是`patchKeyedChildren`，即是对有 key 存在的两组`arrayChildren`做 `diff` 操作 这里沿用了 [vue-design](http://hcysun.me/vue-design/zh/) 的说法。称之为**核心 diff 算法**。

## patchArrayChildren 的问题

上一节实现了 `patchArrayChildren`。这个实现比较简单粗暴。直接对数组一对一进行 `diff`。
但它是有一些问题的。假设有以下两组 arrayChildren c1 c2：

> c1: a b c
> c2: x a b c

只不过是在 children 的头部插入了一个节点，显而易见，最佳的操作是只需在`a`前面新插入一个`x`就行了。
但根据我们现有的算法，虽然复用了前三个 `child` 的元素的 el，但 `child` 的 `children` 都必须得做更新。

有没有办法解决这个问题？有，但是必须要引入`key`
要用`key`来告诉框架，哪些节点是应该复用的，从而使 `vnode diff` 后，产生的真实 `dom` 操作最少。

而此前实现的 `patchArrayChildren`，实际上就是`patchUnkeyedChildren`。

## patchKeyedChildren

### 雏形

只考虚 c1 和 c2 只是顺序不同的情况
最简单的思维：

- 遍历`c2`，对于每个 `c2` 的 `child` (命名为 `next`)，去 `c1` 里寻找有相同 `key` 的 `child`(命名为 `prev`)
- 找到了就进行 `patch`
- 再按 `c2` 的顺序重新排列

要点：

1. `anchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling`;
2. `insertBefore` 对于已存在的节点，会执行移动操作

```javascript
function patchKeyedChildren(c1, c2, container, anchor) {
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i];
    for (let j = 0; j < c1.length; j++) {
      const prev = c1[j];
      if (next.key === prev.key) {
        patch(prev, next, container, anchor);
        const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling;
        container.insertBefore(next.el, curAnchor);
        break;
      }
    }
  }
}
```

### 第一版

只对顺序乱了，需要移动的节点才执行移动

- 遍历`c2`，对于每个 `c2` 的 `child` (命名为 `next`)，去 `c1` 里寻找有相同 `key` 的 `child`(命名为 `prev`)
- 如果找到了，记录下 `prev` 的 `index`
- 如果 `index` 呈升序状态，则顺序不用调整
- 如果 `index` 不呈升序，则需要移动节点

#### 不需要移动

<img src="./assets/diff-react-1.7b07877f.png" width = "500" />

#### 需要移动

<img src="./assets/diff-react-2.e6cef98d.png" width = "500" />

`let maxNewIndexSoFar = 0`
设置一个变量 `maxNewIndexSoFar`，记录当前的 `next` 在 `c1` 中找到的 `index` 的最大值。
若新找到的 `index` 大于等于 `maxNewIndexSoFar`，说明 `index` 呈升序，不需要移动，并更新 `maxNewIndexSoFar` 为 `index`（增大）。
若 `index` 小于 `maxNewIndexSoFar`，说明需要移动。它应该移动到上一个 `next` 之后。因此 `anchor` 设置为 `c2[i-1].el.nextSibling`。

再考虑没 `c1` 中没有找到相同 `key` 的情况，如：
<img src="./assets/diff-react-5.d12b2ed9.png" width = "500" />
这时候说明 `c2` 的这个 `next` 节点是新增的，对它执行 `mount` 操作

再考虑 c1 中有需要移除节点的情况
<img src="./assets/diff-react-6.4ad1a4c1.png" width = "500" />

```javascript
function patchKeyedChildren(c1, c2, container, anchor) {
  let maxNewIndexSoFar = 0;
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i];
    let find = false;
    for (let j = 0; j < c1.length; j++) {
      const prev = c1[j];
      if (prev.key === next.key) {
        find = true;
        patch(prev, next, container, anchor);
        if (j < maxNewIndexSoFar) {
          const curAnchor = c2[i - 1].el.nextSibling;
          container.insertBefore(next.el, curAnchor);
        } else {
          maxNewIndexSoFar = j;
        }
        break;
      }
    }
    if (!find) {
      const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling;
      patch(null, next, container, curAnchor);
    }
  }
  for (let i = 0; i < c1.length; i++) {
    const prev = c1[i];
    if (!c2.find((next) => next.key === prev.key)) {
      unmount(prev);
    }
  }
}
```

### 用 map 优化

```javascript
function patchKeyedChildren(c1, c2, container, anchor) {
  const map = new Map();
  c1.forEach((prev, j) => {
    map.set(prev.key, { prev, j });
  });
  let maxNewIndexSoFar = 0;
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i];
    const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling;
    if (map.has(next.key)) {
      const { prev, j } = map.get(next.key);
      patch(prev, next, container, anchor);
      if (j < maxNewIndexSoFar) {
        container.insertBefore(next.el, curAnchor);
      } else {
        maxNewIndexSoFar = j;
      }
      map.delete(next.key);
    } else {
      patch(null, next, container, curAnchor);
    }
  }
  map.forEach(({ prev }) => {
    unmount(prev);
  });
}
```

据说这就是 `react` 的 `diff` 算法

### react diff 算法的缺点

<img src="./assets/diff-react-2.e6cef98d.png" width = "500" />

如上图，肉眼就可以看出，最佳的方案是只需要移动一次 li-c 节点。但 react 算法对于这种情况会移动两次。

## vue2 的 diff 算法

vue2 采用的是双端比较的算法，源自 **snabbdom**
先分别对四个端点进行比较和移动，如果都不行，再逐个比较
<img src="./assets/diff-vue2-3.933b8708.png" width = "500" />

## vue3 的 diff 算法

在 Vue3 中将采用另外一种核心 Diff 算法，它借鉴于 **ivi** 和 **inferno**。
http://hcysun.me/vue-design/zh/renderer-diff.html#%E7%A7%BB%E9%99%A4%E4%B8%8D%E5%AD%98%E5%9C%A8%E7%9A%84%E5%85%83%E7%B4%A0-2

1. **从左至右依次比对**

2. **从右至左依次比对**
   <img src="./assets/diff2.469b3f9b.png" width = "500" />

3. **经过 1、2 直接将旧结点比对完，则剩下的新结点直接 `mount`，此时 `i > e1`**
   <img src="./assets/diff5.edd80c32.png" width = "500" />
   经过 1、2 直接将新结点比对完，则剩下的旧结点直接 `unmount`，此时 `i > e2`
   <img src="./assets/diff7.df9450ee.png" width = "500" />
4. **若不满足 3，采用传统 `diff` 算法，但不真的添加和移动，只做标记和删除**
   取得一个 `source` 数组
   <img src="./assets/diff11.48afbeb3.png" width = "600" />
   <img src="./assets/diff12.566f24a9.png" width = "600" />

5. **需要移动，则采用新的最长上升子序列算法**

根据 `source` 数组计算出一个最长上升子序列 `seq`

> TIP
>
> 什么是最长递增子序列：给定一个数值序列，找到它的一个子序列，并且子序列中的值是递增的，子序列中的元素在原序列中不一定连续。
>
> 例如给定数值序列为：[ 0, 8, 4, 12 ]
>
> 那么它的最长递增子序列就是：[0, 8, 12]
>
> 当然答案可能有多种情况，例如：[0, 4, 12] 也是可以的

<img src="./assets/diff15.087a1726.png" width = "600" />
`seq` 记录的是 `source` 数组的下标，-1 不算。
它的意义是：`seq` 中的元素都不需要再移动，而没有在 `seq` 中的元素都需要进行移动。
因此得到以下算法：
(1) 设两个指针分别指向 `source` 和 `seq`。`source` 从后向前遍历
(2) 若遇到-1，执行 `mount`，`source`指针减 1
(3) 若 `source` 指针与 `seq` 指针相等，说明不用移动，两个指针都减 1
(4) 若 `source` 指针与 `seq` 指针不相等，执行移动，移动完后 `source` 指针减 1

注意 `anchor` 的计算 `curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor`;

6. **特殊情况：不需要移动，但还有未添加的元素**

> c1: a b c
> c2: a x b y c
> source: [1,-1,2,-1,3]
> seq: [1,2,3]

上面的例子，`move` 是 `false`，因此专门用一个 `toMounted` 去处理这种情况
`toMounted` 记录待新增的元素的下标

## 最长上升子序列

dp 版
O(n^2)

```javascript
var lengthOfLIS = function (nums) {
  let dp = new Array(nums.length).fill(1);
  let max = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    max = Math.max(max, dp[i]);
  }
  return max;
};
```

贪心算法
O(n^2)

```javascript
var lengthOfLIS = function (nums) {
  let arr = [nums[0]];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
    } else {
      for (let j = 0; j < arr.length; j++) {
        if (nums[i] <= arr[j]) {
          arr[j] = nums[i];
          break;
        }
      }
    }
  }
  return arr.length;
};
```

贪心算法+二分
O(nlogn)

```javascript
var lengthOfLIS = function (nums) {
  let arr = [nums[0]];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
    } else {
      let l = 0,
        r = arr.length - 1;
      while (l <= r) {
        let mid = ~~((l + r) / 2);
        if (nums[i] > arr[mid]) {
          l = mid + 1;
        } else if (nums[i] < arr[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      arr[l] = nums[i];
    }
  }
  return arr.length;
};
```

最终版，略过-1，返回子序列

```javascript
function getSequence(nums) {
  let arr = [];
  let position = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    // arr[arr.length - 1]可能为undefined，此时nums[i] > undefined为false
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
      position.push(arr.length - 1);
    } else {
      let l = 0,
        r = arr.length - 1;
      while (l <= r) {
        let mid = ~~((l + r) / 2);
        if (nums[i] > arr[mid]) {
          l = mid + 1;
        } else if (nums[i] < arr[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      arr[l] = nums[i];
      position.push(l);
    }
  }
  let cur = arr.length - 1;
  // 这里复用了arr，它本身已经没用了
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      arr[cur--] = i;
    }
  }
  return arr;
}
```

## 处理 key
