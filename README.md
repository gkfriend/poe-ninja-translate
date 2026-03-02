# POE Ninja 繁體中文化

> 一個為 [poe.ninja](https://poe.ninja) 提供繁體中文翻譯的 Chrome / Edge 瀏覽器插件

## 功能特色

- **物品名稱**：裝備、通貨、地圖、寶石等，全數對照官方繁體中文
- **Tooltip 雙語顯示**：滑鼠懸停時顯示中文詞綴，並保留原始英文，對照閱讀
- **主頁雙語顯示**：道具名稱以中文為主、英文小字輔助
- **天賦 / 輿圖天賦**：基石、Atlas 天賦、昇華職業、著名天賦等均已翻譯
- **技能寶石**：主動技能寶石、輔助技能寶石、變形寶石名稱翻譯
- **語言切換**：插件 popup 可隨時切換英文 / 繁體中文

## 字庫來源

翻譯資料來自 **[SnosMe/awakened-poe-trade](https://github.com/SnosMe/awakened-poe-trade)**（cmn-Hant 資料夾）
此字庫直接從 GGG 官方遊戲客戶端提取，為繁體中文最權威資料。

額外天賦 / 寶石資料爬取自 [poedb.tw](https://poedb.tw/tw/)。

| 類別 | 筆數 |
|------|------|
| 物品名稱 | 4,714 |
| 詞綴 | 6,764 |
| 天賦 / 輿圖天賦 / 寶石 | 2,221 |
| UI 字串 | 77 |

## 安裝方式

本插件尚未上架 Chrome Web Store，請使用**開發者模式手動安裝**：

1. 下載本專案（Clone 或下載 ZIP）
2. 開啟瀏覽器的擴充功能頁面
   - Chrome：`chrome://extensions/`
   - Edge：`edge://extensions/`
3. 開啟右上角 **「開發人員模式」**
4. 點擊 **「載入未封裝項目」**（Load unpacked）
5. 選擇本專案的 **`src/`** 資料夾
6. 前往 [poe.ninja](https://poe.ninja) 並點擊插件圖示切換至繁體中文

## 更新字庫

若需要重新建置翻譯字庫（例如字庫來源有更新）：

```bash
# 1. 安裝依賴（Node.js 18+）
# 確認已安裝 node

# 2. 下載原始字庫（items.ndjson, stats.ndjson 等）
#    從 awakened-poe-trade 的 cmn-Hant 資料夾下載至 data/raw/

# 3. 選用：重新爬取 poedb.tw 天賦 / 寶石資料
node data/fetch-poedb.js

# 4. 重建翻譯字庫
node data/build-translation.js

# 5. 複製至插件目錄
cp data/dist/translation.json src/data/translation.json
```

## 專案結構

```
poe-ninja-tranlate/
├── src/                        # 插件本體
│   ├── manifest.json           # Manifest V3
│   ├── content.js              # 翻譯邏輯（content script）
│   ├── background.js           # Service Worker
│   ├── popup.html / .css / .js # 語言切換 UI
│   ├── icons/                  # 插件圖示
│   └── data/
│       └── translation.json    # 翻譯字庫（1.1MB）
└── data/                       # 字庫建置工具
    ├── build-translation.js    # 合併字庫腳本
    ├── fetch-poedb.js          # poedb.tw 爬蟲
    └── raw/                    # 原始資料（部分不納入版本控制）
```

## 注意事項

- 本插件僅支援 **Path of Exile 一代（POE1）**
- POE2 不在支援範圍內
- 簡體中文功能預留按鈕，尚未實作

## 授權

本專案僅作個人學習與使用，翻譯資料版權歸屬原始來源。
