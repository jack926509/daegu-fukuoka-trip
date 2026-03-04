# 如何下載 `index.html`

如果你在 Codex 平台看不到檔案樹，可以直接用指令把檔案複製到 Desktop：

```bash
mkdir -p ~/Desktop
cat /workspace/daegu-fukuoka-trip/index.html > ~/Desktop/index.html
```

執行完後可用以下指令確認：

```bash
ls -l ~/Desktop/index.html
wc -l ~/Desktop/index.html
```

## 常見問題

- `No such file or directory`：通常是你在本機（不是容器）執行 `/workspace/...` 路徑。
- 在本機請先 `git clone` 專案，再用本機路徑操作 `index.html`。
