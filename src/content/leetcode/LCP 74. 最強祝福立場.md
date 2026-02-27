---
category: "leetcode"

title: "LCP 74 最強祝福立場"   
en_title: "LCP 74 最強祝福立場"

problem_id: "74"
difficulty: "medium"
tags: ["prefix sum", "binary search"]

link: "https://leetcode.cn/problems/xepqZ5/"
en_link: "https://leetcode.cn/problems/xepqZ5/"
date: "2026-01-31"
---
推薦事前閱讀：[二維差分數組介紹](https://gjplieqszy7.sg.larksuite.com/wiki/KJC1wRJAqidzAqkpCEClyp2YgUf#share-COLfdm7lIoAM3Lxw8JMlaIJhg3b)
## 思路
如果單看題目，這跟模板練習題的做法是差不多的，\
問題在於，資料範圍的大小來到了 $10^9$ ，\
如果這個時候還打算申請一個 `diff[1e9][1e9]` 的二維差分數組，空間會爆炸。\
另外，題目給定的是中心點以及半徑，也就是說，會有左上角點在 $(3.5,2.5)$ 的這種座標，\
如果想要單純的加倍來抹除小數點，空間就更不夠了。\
「將座標縮放兩倍來抹除小數點」這個操作可以保留，主要問題在空間不夠。\
既然不能開一個超大的差分數組，那我們可以開一個小的。先統計 $x$ 座標上有幾個不同的座標出現過，\
比如 $[1,10,33550336]$ ，我們不需要開一個寬 $33050336$ 這麼大的差分數組，\
而是將數字重新編號，變成 $[0,1,2]$ 用來代表原先的三個 $x$ 座標。對 $y$ 軸也是一樣的操作。
## 程式碼
### 前綴和 + 離散化處理
```cpp
class Solution {
private:
    void add(vector<vector<int>>& diff, int x1, int y1, int x2, int y2) {
        x1++; y1++; x2++; y2++;
        diff[x1][y1]++;
        diff[x1][y2 + 1]--;
        diff[x2 + 1][y1]--;
        diff[x2 + 1][y2 + 1]++;
    }
public:
    int fieldOfGreatestBlessing(vector<vector<int>>& forceField) {
        vector<long long> sortedX, sortedY;
        for(auto& vec : forceField) {
            long long x = vec[0] << 1, y = vec[1] << 1, r = vec[2];
            sortedX.push_back(x + r); // 縮放後的 X 左
            sortedX.push_back(x - r); // 縮放後的 Y 右
            sortedY.push_back(y + r); // 縮放後的 X 左
            sortedY.push_back(y - r); // 縮放後的 Y 右
        }
        ranges::sort(sortedX);
        ranges::sort(sortedY);
        int m = sortedX.size();
        int n = sortedY.size();
        unordered_map<long long, int> umapX, umapY; // index 代表映射過後的位置
        for(int i = 0; i < m; i++) {
            if(umapX.contains(sortedX[i])) continue; // 去重
            umapX[sortedX[i]] = i;
        }
        for(int i = 0; i < n; i++) {
            if(umapY.contains(sortedY[i])) continue;
            umapY[sortedY[i]] = i;
        }
        vector<vector<int>> diff(m + 2, vector<int>(n + 2));
        for(auto& vec : forceField) {
            long long x = vec[0] << 1, y = vec[1] << 1, r = vec[2];
            add(diff, umapX[x - r], umapY[y - r], umapX[x + r], umapY[y + r]);
        }
        int res = 0;
        for(int i = 1; i <= m; i++) {
            for(int j = 1; j <= n; j++) {
                diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
                res = max(res, diff[i][j]);
            }
        }
        return res;
    }
};
```
### 前綴和 + 離散化 + 二分搜
```cpp
class Solution {
private:
    int sortAndRemoveDuplicate(vector<long long>& nums) { // 用的是引用
        ranges::sort(nums);
        int n = nums.size();
        int size = 1;
        for(int i = 1; i < n; ++i) {
            if(nums[i] != nums[i - 1]) {
                nums[size++] = nums[i];
            }
        }
        nums.resize(size);
        return size; // 回傳去蟲之後的大小
    }
    int getMappedPosition(vector<long long>& nums, long long value) {
        // 使用二分搜來找到位置，省去哈希表的空間
        return lower_bound(nums.begin(), nums.end(), value) - nums.begin();
    }
public:
    int fieldOfGreatestBlessing(vector<vector<int>>& forceField) {
        vector<long long> sortedX, sortedY;
        for(auto& vec : forceField) {
            long long x = vec[0] << 1, y = vec[1] << 1, r = vec[2];
            sortedX.push_back(x + r); // 縮放後的 X 左
            sortedX.push_back(x - r); // 縮放後的 Y 右
            sortedY.push_back(y + r); // 縮放後的 X 左
            sortedY.push_back(y - r); // 縮放後的 Y 右
        }

        // 排序 + 去重
        int m = sortAndRemoveDuplicate(sortedX);
        int n = sortAndRemoveDuplicate(sortedY);
        vector diff(m + 2, vector<int>(n + 2));
        for(auto& vec : forceField) {
            long long x = vec[0] << 1, y = vec[1] << 1, r = vec[2];
            int x1 = getMappedPosition(sortedX, x - r) + 1;
            int y1 = getMappedPosition(sortedY, y - r) + 1;
            int x2 = getMappedPosition(sortedX, x + r) + 1;
            int y2 = getMappedPosition(sortedY, y + r) + 1;
            diff[x1][y1]++;
            diff[x1][y2 + 1]--;
            diff[x2 + 1][y1]--;
            diff[x2 + 1][y2 + 1]++;
        }
        int res = 0;
        for(int i = 1; i <= m; i++) {
            for(int j = 1; j <= n; j++) {
                diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
                res = max(res, diff[i][j]);
            }
        }
        return res;
    }
};
```
## 複雜度分析
- 時間複雜度：$O(k^2)$
- 空間複雜度：$O(k)$

