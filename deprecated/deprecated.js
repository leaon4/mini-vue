/* 记录一些不用但不想删的代码 */

// 原始版本
function patchKeyedChildren(c1, c2, container, anchor) {
  let maxIndex = 0;
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i];
    let find = false;
    for (let j = 0; j < c1.length; j++) {
      const prev = c1[j];
      if (prev.key === next.key) {
        find = true;
        patch(prev, next, container, anchor);
        if (j < maxIndex) {
          const curAnchor = c2[i - 1].el.nextSibling;
          container.insertBefore(next.el, curAnchor);
        } else {
          maxIndex = j;
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

// 这个版本可以兼容没有key的情况。但没有意义
function patchKeyedChildren(c1, c2, container, anchor) {
  let maxIndex = 0;
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i];
    if (next.key == null) {
      const curAnchor =
        i === 0 ? c1[0].el : (c2[i - 1].anchor || c2[i - 1].el).nextSibling;
      patch(null, next, container, curAnchor);
      continue;
    }
    let find = false;
    for (let j = 0; j < c1.length; j++) {
      const prev = c1[j];
      if (prev.key == null) {
        continue;
      }
      if (prev.key === next.key) {
        find = true;
        patch(prev, next, container, anchor);
        if (j < maxIndex) {
          const curAnchor = c2[i - 1].el.nextSibling;
          container.insertBefore(next.el, curAnchor);
        } else {
          maxIndex = j;
        }
        break;
      }
    }
    if (!find) {
      const curAnchor =
        i === 0 ? c1[0].el : (c2[i - 1].anchor || c2[i - 1].el).nextSibling;
      patch(null, next, container, curAnchor);
    }
  }
  for (let i = 0; i < c1.length; i++) {
    const prev = c1[i];
    if (!c2.find((next) => next.key && next.key === prev.key)) {
      unmount(prev);
    }
  }
}

// 最终版，用map优化
// 并假设没有重复key
function patchKeyedChildren(c1, c2, container, anchor) {
  const map = new Map();
  c1.forEach((prev, j) => {
    map.set(prev.key, { prev, j });
  });
  let maxIndex = 0;
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i];
    const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling;
    if (map.has(next.key)) {
      const { prev, j } = map.get(next.key);
      patch(prev, next, container, anchor);
      if (j < maxIndex) {
        container.insertBefore(next.el, curAnchor);
      } else {
        maxIndex = j;
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

// dp版
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

// 新算法，但没用二分查找
var lengthOfLIS = function (nums) {
  let result = [nums[0]];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i]);
    } else {
      for (let j = 0; j < result.length; j++) {
        if (nums[i] <= result[j]) {
          result[j] = nums[i];
          break;
        }
      }
    }
  }
  return result.length;
};

// 新算法带二分
var lengthOfLIS = function (nums) {
  let result = [nums[0]];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i]);
    } else {
      let l = 0,
        r = result.length - 1;
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
      result[l] = nums[i];
    }
  }
  return result.length;
};

// 返回子序列版
// https://blog.csdn.net/ouckitty/article/details/27801843
function lengthOfLIS(nums) {
  let result = [nums[0]];
  let position = [0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i]);
      position.push(result.length - 1);
    } else {
      let l = 0,
        r = result.length - 1;
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
      result[l] = nums[i];
      position.push(l);
    }
  }
  let cur = result.length - 1;
  for (let i = position.length; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      result[cur--] = i;
    }
  }
  return result;
}

// 最终版，略过-1
function getSequence(nums) {
  let result = [];
  let position = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    // result[result.length - 1]可能为undefined，此时nums[i] > undefined为false
    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i]);
      position.push(result.length - 1);
    } else {
      let l = 0,
        r = result.length - 1;
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
      result[l] = nums[i];
      position.push(l);
    }
  }
  let cur = result.length - 1;
  // 这里复用了result，它本身已经没用了
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      result[cur--] = i;
    }
  }
  return result;
}
