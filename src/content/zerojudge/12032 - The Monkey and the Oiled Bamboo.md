---
category: "zerojudge"

title: "12032 - The Monkey and the Oiled Bamboo"

problem_id: ""
tags: ["binary search"]

link: "https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3183"
date: "2026-02-02"
---
## 思路
給定一個嚴格遞增的陣列，代表竹子的高度，要找一個滿足條件的最小力氣 $k$。

如果需要消耗的力氣等於等於 $k$，$k$ 減一。

---

假設現在 $k=1$，竹子高度 $[1,2,3,4,5]$，
1. 一開始在位置 0，往第一個位置跳，需要花費`1 - 0`的力氣，需要花費的力氣等於 $k$，因此力氣 -1，變成 0。
2. 接下來要跳往第二個位置，需要花費`2 - 1`的力氣，現在力氣不夠，所以無法抵達終點。

如果 $k=2$，每次往下個位置跳的需求力氣都是 1，所以能成功到達終點。
因為滿足條件的 $k$ 最小就是 2，因此輸出 2。

---

1. 一次找到最小的位置太難。
2. 當力氣越大，就越有可能抵達終點。

根據前兩點，我們可以二分查找合適的答案，\
假如當前力氣 $x$ 可以抵達終點，那麼 $\geq{x}$ 的力氣也都可以抵達終點。\
每次去猜 $k$ 的數值，然後透過模擬看能不能抵達終點，\
題目要找最小值，因此往更小的地方去找。

## 程式碼
### 二分查找
```cpp
#include <iostream>
using namespace std;

const int MX = 100005;
int nums[MX]{};
int n, m;

bool check(int k) {
    int cur = 0;
    for(int i = 0; i < n; i++) {
        int dist = nums[i] - cur;
        if(dist > k) return false;
        else if(dist == k)  k--;
        cur = nums[i];
    }
    return true;
}

int main(void) {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    for(int c = 1; c <= t; c++) {
        cin >> n;
        for(int i = 0; i < n; i++) {
            cin >> nums[i];
        }
        int left = 1, right = 1e7;
        while(left <= right) {
            int mid = left + (right - left) / 2;
            if(check(mid)) {
                right = mid - 1;
            }
            else {
                left = mid + 1;
            }
        }
        cout << "Case " << c << ": " << left << "\n"; 
    }
}
```
## 複雜度分析
- 時間複雜度：$O(n\log{n})$
- 空間複雜度：$O(n)$
