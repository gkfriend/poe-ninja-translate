# POE Ninja 繁體中文翻譯插件 - 專案企劃案

## 專案目標
製作一個 Edge/Chrome 瀏覽器插件，當使用者瀏覽 [poe.ninja](https://poe.ninja) 時，自動將頁面相關內容翻譯為繁體中文。

---

## 版本規則

### 版本號
- 插件版本號顯示於 `src/popup.html` 的 footer 與 `src/manifest.json` 的 `"version"` 欄位
- **⚠️ 強制規則：任何對 `src/` 下檔案的修改，無論大小，都必須遞增版本號**
- 版本號格式：次版本號每次 +0.0.1（例如 v0.9.2 → v0.9.3）
- 必須同步更新的三個位置：
  1. `src/popup.html` footer 的版本文字
  2. `src/manifest.json` 的 `"version"` 欄位
  3. 本 `CLAUDE.md` 的「目前版本」
- 從 v0.9.1 開始計算
- 目前版本：**v0.9.3**

---

## 規則一覽

### 1. 翻譯範圍
- 目標網站：`poe.ninja`（POE1 相關頁面）
- 翻譯項目：Items（裝備）、Main Skills（主技能）、Passives（天賦）、通貨（Currency）等

### 2. 翻譯方式
- **禁止**直接英翻中（機器翻譯）
- **必須**依照官方字庫對照表進行翻譯
- 只處理 **Path of Exile 一代（POE1）**
- **POE2 完全不做**，等 POE1 插件確認無 bug 後，才考慮製作 POE2 版本

### 3. 字庫來源（已確定）
- 字庫必須來自**單一來源**：`SnosMe/awakened-poe-trade`（cmn-Hant 資料夾）
- 此來源直接從 GGG 官方遊戲客戶端提取，為繁體中文最權威資料
- 其他候選已排除：
  - GGG 官方 Trade API：不支援繁體中文（只有英文）❌
  - poedb.tw：無 API，無結構化資料，需爬蟲 ❌

**字庫檔案 URL：**
- Items: `https://raw.githubusercontent.com/SnosMe/awakened-poe-trade/master/renderer/public/data/cmn-Hant/items.ndjson`（4,743 項）
- Stats: `https://raw.githubusercontent.com/SnosMe/awakened-poe-trade/master/renderer/public/data/cmn-Hant/stats.ndjson`（6,748 項）
- App I18n: `https://raw.githubusercontent.com/SnosMe/awakened-poe-trade/master/renderer/public/data/cmn-Hant/app_i18n.json`
- Client Strings: `https://raw.githubusercontent.com/SnosMe/awakened-poe-trade/master/renderer/public/data/cmn-Hant/client_strings.js`

### 4. 插件功能規格
- Manifest V3（最新標準）
- 目標網址：`https://poe.ninja/*`
- **開關按鈕**：插件 popup 提供語言切換按鈕
  - 選項一：英文（原語言，預設）
  - 選項二：繁體中文
  - 選項三：簡體中文（**按鈕先建立，暫不實作功能，等待日後指示**）

---

## 工作進度追蹤

### 階段一：字庫研究（已完成）
- [x] 初步調查可用的 POE1 繁體中文字庫來源
- [x] 評估各來源的完整性與權威性，**決定唯一採用來源**
- [ ] 下載/整理字庫資料，建立翻譯對照 JSON

### 階段二：插件開發（未開始）
- [ ] 建立插件基本結構（manifest.json、popup、content script）
- [ ] 實作繁體中文翻譯功能（套用字庫）
- [ ] 實作開關 UI（三個按鈕：英文 / 繁體中文 / 簡體中文）
- [ ] 簡體中文按鈕：建立但不實作，待日後指示

### 階段三：測試與調整（未開始）
- [ ] 在 poe.ninja 實際測試翻譯效果
- [ ] 調整翻譯未覆蓋的項目

---

## 中斷恢復指引

若對話中斷重開，請：
1. 讀取此 `CLAUDE.md` 了解專案全貌與當前進度
2. 查看 `docs/` 資料夾（若存在）取得已收集的字庫資料
3. 查看 `src/` 資料夾（若存在）取得已完成的插件程式碼
4. 繼續最近未完成的階段任務
