---
category: "zerojudge"

title: "11413 - Fill the Containers"

problem_id: "11413"
tags: ["binary search"]

link: "https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2408"
date: "2026-02-02"
---
## 思路
解法同 [[410]]，只有處理輸入輸出的部分稍微有些不同。

要將陣列分割成 $k$個非空的子陣列，並找到一個分割方法，能使子陣列的總和最大值最小。\
比如陣列 $[1,2,3,4,5],k=2$ ，最好的分法是 $[1,2,3],~[4,5]$，子陣列的總和分別是 $6,~9$，\
最大值是 $9$，是所有分割方案當中最小的。

---

假如不管 $k$ 的限制，在陣列 $[1,2,3,4,5]$ 當中。
- 最糟糕的子陣列總和，就是陣列本身的總和 15。
- 最佳的子陣列總和，就是把陣列徹底拆了，取最大值，為 5。
現在加上了 $k$ 的限制，最糟糕的答案不會比 15 更高，也不會比 5 更低，我們找到了最後答案的上界與下界。\
接下來試著用二分的方式猜答案，`mid = 10`，要怎麼驗證這個答案呢？\
這時的`mid`代表子陣列總和的最大值，想要驗證這個答案合不合理，就去看能不能把陣列切成幾個總和不超過`mid`的子陣列，假如沒辦法在`mid`的限制下將陣列切成 $\leq{k}$ 份，`mid`就是不合理的答案。
- `mid = 10`，可切割成 $[1,2,3],~[4,5]$，更新邊界為 `5, 9`（閉區間）
- `mid = 7`，只能切成 $[1,2,3],[4],[5]$，更新邊界 `8, 9`
- `mid = 8`，只能切成 $[1,2,3],[4],[5]$，更新邊界 `9, 9`
- `mid = 9`，可切割成 $[1,2,3],~[4,5]$，更新邊界 `9, 8`，觸發終止條件，
## 程式碼
### 二分答案
```cpp
#include <iostream>
using namespace std;
const int MX = 1005;
int nums[MX]{};

int n, m;
bool check(int limit) {
    int cnt = 1;
    int sum = 0;
    for(int i = 0; i < n; i++) {
        if(sum + nums[i] > limit) {
            cnt++;
            sum = nums[i];
        }
        else {
            sum += nums[i];
        }
    }
    return cnt <= m;
}
int main(void) {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int left, right;
    while(cin >> n >> m) {
        left = 0, right = 0;
        for(int i = 0; i < n; i++) {
            cin >> nums[i];
            left = max(left, nums[i]);
            right += nums[i];
        }
        while(left <= right) {
            int mid = left + (right - left) / 2;
            if(check(mid)) {
                right = mid - 1;
            }
            else {
                left = mid + 1;
            }
        }
        cout << left << "\n";
    }
}
```
## 複雜度分析
- 時間複雜度：$O(n\log{n})$
- 空間複雜度：$O(n)$
