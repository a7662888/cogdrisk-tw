# 🧠 CogDrisk 失智風險評估工具 繁體中文版

[![GitHub Pages](https://img.shields.io/badge/線上使用-GitHub%20Pages-teal?style=flat-square)](https://a7662888.github.io/cogdrisk-tw/)
[![License](https://img.shields.io/badge/改編授權-NeuRA%20%2F%20UNSW-blue?style=flat-square)](https://cogdrisk.com)
[![Version](https://img.shields.io/badge/版本-v1.0--TW-yellow?style=flat-square)](#)

**互動式社區版失智風險因子評估工具，適用台灣民眾，具備自動雲端資料收集與多維度分析功能。**

---

## 🌟 功能特色

| 功能 | 說明 |
|------|------|
| ✅ **多領域評估** | 10 節問卷（約 55 題），涵蓋心血管、睡眠、情緒、體能、認知、社交、飲食、菸酒、環境暴露 |
| ✅ **標準量表計分** | 自動計算 ISI（失眠）、CES-D（憂鬱）、IPAQ（體能 MET）、MIND 飲食分數、UCLA-3（孤獨感） |
| ✅ **三色風險燈號** | 各領域 ✅良好 / ⚡注意 / ⚠️需改善，整體評為低／中／高風險 |
| ✅ **台灣情境建議** | 個人化衛教建議，含戒菸熱線、健保補助、安心專線等台灣在地資源 |
| ✅ **自動雲端儲存** | 每次評估完成後自動、靜默上傳至 Google Drive（個別 JSON + 更新總表） |
| ✅ **列印與下載** | 支援瀏覽器列印（含 CSS 列印樣式）及下載 `.txt` 文字報告 |
| ✅ **返回修改** | 結果頁可返回問卷重新填答；「重新評估」按鈕一鍵全清 |
| ✅ **隱私保護** | 純前端運算，資料僅傳送至您本人設定的 Google Drive |

---

## 🔬 評估量表說明

| 領域 | 採用量表 | 計分說明 |
|------|----------|----------|
| 😴 睡眠 | ISI（Insomnia Severity Index） | 7 題，0–28 分；≥8 為輕度以上失眠 |
| 😊 情緒 | CES-D 10 項版 | 10 題（含 2 題反向），0–30 分；≥10 為可能憂鬱傾向 |
| 🏃 體能活動 | IPAQ 短版（Short Form） | 計算 MET-min/週；<600 為活動不足 |
| 🥦 飲食 | MIND Diet Score | 14 項食物類別，0–14 分；<7 為飲食品質需改善 |
| 👥 社交 | UCLA 孤獨感量表 3 題版 | 3–9 分；≥6 為明顯孤獨感 |
| ❤️ 心血管 | 複合指標（高血壓、糖尿病、高膽固醇、中風、心房顫動、BMI、頭傷） | ≥2 項為風險 |

---

## 📊 Google Drive 資料結構

每次評估完成後，資料自動靜默儲存至 Google Drive 指定資料夾：

```
CogDrisk_TW評估資料/
├── CogDrisk_65y_20260421_143522.json   ← 個別評估原始資料
├── CogDrisk_72y_20260422_091015.json
├── CogDrisk_58y_20260423_160344.json
└── CogDrisk_TW_總表                    ← Google Sheets 整合總表（自動更新）
    └── 評估總表（工作表）
        ├── 評估時間、年齡、性別、教育程度
        ├── BMI / BMI分類
        ├── ISI失眠分數 / 等級
        ├── CES-D憂鬱分數 / 等級
        ├── IPAQ體能MET / 等級
        ├── MIND飲食分數 / 等級
        ├── UCLA社交分數 / 等級
        ├── 吸菸 / 飲酒
        ├── 心血管因子數 / 項目
        ├── 風險領域數 / 項目
        └── 備註 / 版本
```

---

## 🚀 快速開始

### 線上使用

直接前往 **[https://a7662888.github.io/cogdrisk-tw/](https://a7662888.github.io/cogdrisk-tw/)** 即可使用。

### 本機使用

```bash
git clone https://github.com/a7662888/cogdrisk-tw.git
# 用瀏覽器直接開啟 index.html
```

---

## ⚙️ Google Drive 自動儲存設定

> **首次使用請完成以下設定，否則資料不會儲存至雲端。**

### 步驟 1：建立 Google Apps Script

1. 前往 [https://script.google.com](https://script.google.com) → **新增專案**
2. 刪除預設程式碼，將 [`apps-script/Code.gs`](apps-script/Code.gs) 的內容全部貼上
3. 點選左上角專案名稱，改為 `CogDrisk-TW`
4. 按 **Ctrl+S** 儲存

### 步驟 2：部署為 Web App

1. 上方選單 → **部署** → **管理部署** → **新增部署**（＋圖示）
2. 設定如下：

   | 設定項目 | 值 |
   |---|---|
   | 類型 | 網頁應用程式 |
   | 執行身分 | **我**（您的 Google 帳號） |
   | 存取權限 | **所有人**（含匿名使用者） |

3. 點選 **部署** → Google 要求授權時點選「允許」
4. 複製顯示的 **Web App URL**（格式：`https://script.google.com/macros/s/AKfy.../exec`）

### 步驟 3：填入 URL

開啟 `index.html`，找到第一行 JavaScript 設定區，將 URL 貼入：

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/您的URL/exec';
```

### 步驟 4：驗證

1. 直接在瀏覽器開啟 Web App URL（GET 請求），應看到：
   ```
   ✅ CogDrisk-TW Apps Script is running. 2026-04-21T...
   ```
2. 完成一次評估，前往 Google Drive 確認是否出現 `CogDrisk_TW評估資料` 資料夾

### 更新腳本後

每次修改 `Code.gs` 後需重新部署：
**部署 → 管理部署 → 鉛筆圖示（編輯）→ 版本選「新版本」→ 部署**

---

## 🔧 技術架構

```
前端（index.html）
├── HTML5 + CSS3 + Vanilla JavaScript
├── 純靜態單頁，無框架依賴
├── 計分模組：ISI / CES-D / IPAQ / MIND / UCLA-3
├── 結果顯示：三色風險燈號 + 個人化建議
└── 報告輸出：列印 / .txt 下載 / Google Drive 上傳

雲端（Google Apps Script）
├── doPost()：接收 JSON 資料
├── saveJsonFile()：個別存檔至 Google Drive
└── updateSummarySheet()：更新 Google Sheets 總表
```

---

## 📁 檔案結構

```
cogdrisk-tw/
├── index.html              # 主要評估工具網頁
├── apps-script/
│   └── Code.gs             # Google Apps Script 程式碼
└── README.md               # 本說明文件
```

---

## 📋 問卷來源與改編說明

本工具改編自：

> Anstey KJ, et al. (2022). Development of the CogDrisk tool to assess risk factors for dementia. *Alzheimer's & Dementia: Diagnosis, Assessment & Disease Monitoring*, 14(1), e12336.
> [https://doi.org/10.1002/dad2.12336](https://doi.org/10.1002/dad2.12336)

原始工具由 **神經科學研究所（NeuRA）** 與 **新南威爾斯大學（UNSW Sydney）** 共同開發。

**台灣版改編重點：**
- 移除澳洲特定問題（原住民族群、標準飲料定義等）
- 加入台灣在地衛教資源（戒菸熱線、安心專線、健保補助）
- 台灣 BMI 標準（過重≥24、肥胖≥27）
- 飲食建議融合 MIND 飲食與本土食材（地瓜葉、豆腐、魚類等）
- 繁體中文介面，語言邏輯符合台灣用語習慣

---

## ⚠️ 免責聲明

本工具**僅供教育與健康促進用途**，不能取代醫師診斷。評估結果僅反映問卷當下的生活型態風險因子，不代表已罹患或將罹患失智症。

如對認知功能有疑慮，請至神經內科或記憶門診就診。

---

## 📞 台灣失智相關資源

| 資源 | 聯絡方式 |
|------|----------|
| 失智症協會 | [https://www.tada2002.org.tw](https://www.tada2002.org.tw) |
| 失智共照網 | [https://www.ltc-learning.org.tw](https://www.ltc-learning.org.tw) |
| 長照 3.0 服務 | 撥打 1966 長照服務專線 |
| 戒菸服務專線 | 0800-636363 |
| 安心專線（心理健康） | 1925（24 小時） |

---

*CogDrisk-TW 繁體中文版由台灣失智防治中心開發維護。*
