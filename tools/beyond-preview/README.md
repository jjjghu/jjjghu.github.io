# 解題之外：預覽跟著切換

在 VS Code 切換到 `src/content/beyond/` 底下的文章時，`npm run dev` 開著的預覽網頁會跳到那一篇。

安裝或更新（在這個資料夾裡執行，裝完後重新載入 VS Code 視窗）：

```sh
npx @vscode/vsce package --skip-license --allow-missing-repository -o ../../beyond-preview.vsix
code --install-extension ../../beyond-preview.vsix
```

產生在專案根目錄的 `beyond-preview.vsix` 裝完就可以刪掉。移除：在擴充功能面板找「解題之外：預覽跟著切換」解除安裝。
