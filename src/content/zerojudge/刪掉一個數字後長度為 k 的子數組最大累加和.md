---
category: "zerojudge"
title: "刪掉一個數字後長度為 k 的子數組最大累加和"

problem_id: "deleteNumLenK"

tags: ["sliding window", "monotonic queue"]

link: ""
date: "2026-08-10"
---

> 沒有題目連結，對數器（對拍）驗證

給定一個數組`nums`，求刪除一個數字後的新數組中，長度為 k 子數組的最大累加和，刪除哪一個數字隨意。

## 思路

我們可以建立一個長度為`k+1`的窗口，紀錄這`k+1`個數的總和，同時利用單調隊列維護這`k+1`個數字的最小值。

> 這應該算是單調隊列跟滑動窗口的題目，不過題目都說是累加和了，就放在這裡了。

## 程式碼

```cpp
#include <iostream>
#include <vector>
#include <queue>
#include <random>
#include <algorithm>
#include <climits>
using namespace std;

int bruteForce(vector<int>& nums, int k) {
    int n = nums.size();
    int res = INT_MIN;
    for(int skip = 0; skip < n; skip++) { // 刪掉 nums[i] 這個數字
        vector<int> temp;
        for(int i = 0; i < n; i++) {
            if(i == skip) continue;
            temp.push_back(nums[i]);
        }
        for(int i = 0; i < n - k; i++) { // 左邊界
            int curSum = 0;
            for(int j = 0; j < k; j++) { // 共 k 個數字
                curSum += temp[i + j];
            }
            res = max(res, curSum);
        }
    }
    return res;
}

int maxSum(vector<int>& nums, int k) {
    int n = nums.size();
    int res = INT_MIN;

    int curSum = 0; // sums = nums[0...k] 共 k + 1 個數的總和
    deque<int> dq; // 紀錄當前可刪掉的數字中, 最小的那一個所在的位置
    for(int i = 0; i < n; i++) {
        // 位置 i 進入單調隊列, 維護最小值
        while(!dq.empty() && nums[dq.back()] >= nums[i]) { // 如果新來的要更小，前面的就沒機會了
            dq.pop_back();
        }
        dq.push_back(i);

        curSum += nums[i];
        if(i >= k) { // 此時 curSum 紀錄共 k + 1 個數的總合, 可以計算
            res = max(res, curSum - nums[dq.front()]);
            if(dq.front() == i - k) { // 最左側的位置過期，從隊列中彈出
                dq.pop_front();
            }
            curSum -= nums[i - k];
        }
    }
    return res;
}

int main(void) {

    random_device rd;
    mt19937 gen(42); // fixed seed
    uniform_int_distribution<int> distrib(1, 100); // 長度
    uniform_int_distribution<int> distribNum(-100, 100); // 數字值

    int T = 100;
    bool passed = true;
    for(int t = 1; t <= T; t++) {
        int n = distrib(gen);
        int k = distrib(gen);
        if(n < k) {
            swap(n, k);
        }
        vector<int> nums(n);
        for(int i = 0; i < n; i++) {
            nums[i] = distribNum(gen);
        }

        int ans1 = maxSum(nums, k);
        int ans2 = bruteForce(nums, k);
       if(ans1 != ans2) {
            cout << "TestCase " << t << ", n = " << n << endl;
            for(int x : nums) cout << x << " ";
            cout << endl;
            printf("ans1 = %d, ans2 = %d, wrong answer!\n\n", ans1, ans2);
            passed = false;
        }
    }
    if(passed) {
        cout << "all passed!" << endl;
    }
    else {
        cout << "wrong answer!" << endl;
    }
}
```

## 複雜度分析

- 時間複雜度：$O(n)$
- 空間複雜度：$O(n)$
