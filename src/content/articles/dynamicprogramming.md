---
title: "動態規劃"
---

## 介紹

有些遞迴在展開的過程中，常常會重複計算相同問題的解。要是能事先記下來這些算過的答案，對於後續計算其他數值會有所幫助。
比如說，現在給定一個數字 $n$ ，請你計算 $1!+2!+\cdots+n!$ 的數值。

```cpp
#include <iostream>
using namespace std;
int factorial(int x) {
    if(x == 0) return 1;
    return x * factorial(x - 1);
}
int main(void) {
    int n;
    cin >> n;
    int res = 0;
    for(int i = 0; i <= n; i++) {
        int fac = factorial(i);
        cout << fac << " ";
        res += factorial(i);
    }
    cout << endl;
    cout << res << endl;
}
```

可以注意到，當計算`factorial(5)`（以下簡稱`fac`），也就是 $5!$ 時，需要知道 $4!$ 的數值，而答案早在`i=4`時就已經計算過了。要是事先存下計算的結果，那麼就能節省下重複計算`fac(4)`的時間。
這種用空間代替重複計算的方法，就是動態規劃。
