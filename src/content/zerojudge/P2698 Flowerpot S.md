---
category: "zerojudge"

title: "P2698 Flowerpot S"

problem_id: "P2698"
tags: ["monotonic queue"]

difficulty: "普及+/提高"
link: "https://www.luogu.com.cn/problem/P2698"
date: "2026-02-10"
---
## 思路
給定一系列的座標點 $(x,y)$ 代表水落下時的最初座標，\
現在要找出最短的花盆寬度，讓接住的水中，最高點的水跟最低點的水差距 $\geq{D}$ 。\
先紀錄雨水的所有座標，並按照 $x$ 軸排序。
- 此時當寬度越大，就越有可能讓 $y$ 軸的差距擴大，反之就越小。

當 $y$ 軸的差距滿足條件的時候，將此時花盆的大小列入參考。\
跟[[1438]]的內容超級像。
## 程式碼
### 單調隊列
```cpp
#include <iostream>
#include <algorithm>
#include <climits>
using namespace std;
const int MX = 1e5 + 5;
int mx_q[MX], mn_q[MX];
pair<int,int> nums[MX]; // 紀錄 x, y 座標
int n, d;
int compute() {
    int res = INT_MAX;
    int mx_left, mx_right;
    int mn_left, mn_right;
    int left;
    mx_left = mx_right = mn_left = mn_right = left = 0;
    for(int i = 0; i < n; i++) {
        while(mx_left != mx_right && nums[mx_q[mx_right - 1]].second <= nums[i].second) { 
            // 比較 y 軸，如果後來者的 y 比較大，最爛替補就沒希望了。
            mx_right--;
        }
        mx_q[mx_right++] = i;
        while(mn_left != mn_right && nums[mn_q[mn_right - 1]].second >= nums[i].second) { 
            // 比較 y 軸，如果後來者的 y 比較小，最爛替補就沒希望了。
            mn_right--;
        }
        mn_q[mn_right++] = i;
        while(nums[mx_q[mx_left]].second - nums[mn_q[mn_left]].second >= d) { // y 軸的差滿足條件，試著縮減
            // printf("參考 %d - %d = %d\n", nums[i].first, nums[left].first, nums[i].first - nums[left].first);
            res = min(res, nums[i].first - nums[left].first); // 花盆的寬度，取決於 x 的差
            if(left == mx_q[mx_left]) {
                mx_left++;
            }
            if(left == mn_q[mn_left]) {
                mn_left++;
            }
            left++;
        }
    }
    return res == INT_MAX ? -1 : res;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> d;
    for(int i = 0; i < n; i++) {
        cin >> nums[i].first >> nums[i].second;
    }
    sort(nums, nums + n); // 主要按照 x 排序, 當寬度越大，高度差距就有可能越大
    cout << compute();
}
```
## 複雜度分析
- 時間複雜度：$O(n)$
- 空間複雜度：$O(n)$
