---
category: "leetcode"
title: "bytedance-006. 夏季特賣"
en_title: "bytedance-006. 夏季特賣"

problem_id: "tJau2o"
difficulty: "easy"
tags: ["dp"]

link: "https://leetcode.cn/problems/tJau2o/"
en_link: "https://leetcode.cn/problems/tJau2o/"
date: "2026-08-29"
---

## 思路

與[[P1048]]不同的地方在於，只要省下的金錢 > 超出預算的錢，就不會覺得吃虧。在不覺得吃虧的前提下，讓快樂值盡量大。

## 程式碼

### 動態規劃 空間壓縮

```cpp
#include <iostream>
#include <algorithm>
using namespace std;

const int MX_N = 501;
const int MX_X = 1000001;

long long cost[MX_N];
long long w[MX_N];
long long dp[MX_X]; // dp[j] 代表預算在 j 時，可以獲取到的最大快樂值。

int n, m, x;

long long bag_01() {
    fill(dp, dp + x + 1, 0);
    for(int i = 1; i <= m; i++) {
        for(int j = x; j >= cost[i]; j--) {
            dp[j] = max(dp[j], dp[j - cost[i]] + w[i]);
        }
    }
    return dp[x];
}

int main(void) {

    cin >> n >> x;

    // 如果我買下這個遊戲所省下的金錢 a[i] - b[i], 相當於我的預算增加了 a[i] - b[i]
    // 因此若 a[i] - b[i] > 實際花費 b[i]，這個遊戲就是必買的。

    m = 1; // 注意這裡的初始化
    int pre, cur, well;
    long long res = 0, happy;
    for(int i = 0; i < n; i++) {
        cin >> pre >> cur >> happy;
        well = pre - cur - cur; // 省去的價格 - 實際花費
        if(well >= 0) {
            x += well;
            res += happy;
        } else { // 不是必買的商品，可以選或不選
            cost[m] = -well;
            w[m++] = happy;
        }
    }
    res += bag_01();
    cout << res;
}
```

## 複雜度分析

- 時間複雜度：$O(NX)$
- 空間複雜度：$O(X)$
