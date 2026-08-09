---
category: "leetcode"

title: "LCP 35. 電動車遊城市"
en_title: "LCP 35. 電動車遊城市"

problem_id: "LCP35"
difficulty: "hard"
tags: ["graph", "shortest path"]

link: "https://leetcode.cn/problems/DFPeFJ/"
en_link: "https://leetcode.cn/problems/DFPeFJ/"
date: "2026-07-10"
---

## 思路

假如沒有充電的條件，這道題目就是單純找最短路徑的題目。但現在有了充電與電量限制，因此多了「停留充電」的選項，並且前往其他城市時，需要花費足夠的電量才能前往。
在每一個節點當中，你可以選擇充電或不充電。

- 充電：總成本增加 `charge[city]`，停留在原城市。
- 不充電：不增加成本，花費電量前往其他城市。\
  因為要判斷自己的電量是否足夠前往其他城市，需要額外記錄抵達城市時的電量，因此對每一個節點擴點：
- `dist[city][power]`：代表來到城市 `city` 時，電動車所擁有的電量。

## 程式碼

### 鏈式前向星建圖 + 分層圖最短路徑

```cpp
class Solution {
private:
    static const int MX_N = 100;
    static const int MX_M = 9901;

    int head[MX_N];
    int next[MX_M];
    int to[MX_M];
    int weight[MX_M];
    int id = 1;

    // dijkstra
    int dist[MX_N][MX_N];
    int visited[MX_N][MX_N]{}; // 來到的城市，到達時的電量

    void build(int n, int cnt) {
        fill(head, head + n + 1, 0);
        id = 1;

        for(int i = 0; i < n; i++) {
            fill(dist[i], dist[i] + cnt + 1, INT_MAX);
        }
    }

    void addEdge(int u, int v, int w) {
        next[id] = head[u];
        head[u] = id;
        to[id] = v;
        weight[id] = w;
        id++;
    }

public:
    int electricCarPlan(vector<vector<int>>& paths, int cnt, int start, int end, vector<int>& charge) {
        int n = charge.size();
        build(n, cnt);
        for(auto path : paths) {
            addEdge(path[0], path[1], path[2]);
            addEdge(path[1], path[0], path[2]);
        }
        using tiii = tuple<int, int, int>;
        priority_queue<tiii, vector<tiii>, greater<tiii>> pq; // dist, node, state
        pq.emplace(0, start, 0);

        dist[start][0] = 0;

        while(!pq.empty()) {
            auto [curDist, node, power] = pq.top(); pq.pop();
            if(visited[node][power]) continue;
            visited[node][power] = true;
            if(node == end) {
                return curDist;
            }

            if(power + 1 <= cnt) { // 可以充電
                pq.emplace(curDist + charge[node], node, power + 1);
            }

            for(int ei = head[node]; ei != 0; ei = next[ei]) { // 充完電後，往其他城市前進
                int nd = curDist + weight[ei]; // 前往下一個城市需要花費 weight[ei]
                int np = power - weight[ei]; // 電量消耗掉 weight[ei]
                if(np >= 0 && nd < dist[to[ei]][np]) {
                    dist[to[ei]][np] = nd;
                    pq.emplace(nd, to[ei], np);
                }
            }

        }
        return -1;
    }
};
```

## 複雜度分析

- 時間複雜度：$O(n\cdot{cnt}\cdot(n+cnt))$
- 空間複雜度：$O(n\cdot{cnt})$
