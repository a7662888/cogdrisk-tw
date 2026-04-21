/**
 * CogDrisk-TW Google Apps Script  v1.0
 * ──────────────────────────────────────────────────────────────────────────────
 * 功能：接收 CogDrisk 繁體中文版評估資料，儲存至 Google Drive
 *   • 每次評估 → 一個獨立 JSON 檔（個別存檔）
 *   • 同步更新同資料夾內的 Google Sheets 總表
 *
 * 部署步驟（首次）：
 *   1. 前往 https://script.google.com → 建立新專案
 *   2. 貼上本程式碼，儲存（Ctrl+S）
 *   3. 部署 → 管理部署 → 新增部署
 *      - 類型：網頁應用程式
 *      - 執行身分：我（您的帳號）
 *      - 存取權限：所有人（含匿名使用者）
 *   4. 點選「部署」→ 複製 Web App URL
 *   5. 貼至 index.html 第一行 SCRIPT_URL 變數
 *
 * 更新腳本後：部署 → 管理部署 → 編輯 → 版本選「新版本」→ 部署
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── 設定區（可依需求修改）────────────────────────────────────────────────────
const CONFIG = {
  folderName : 'CogDrisk_TW評估資料',   // Google Drive 資料夾名稱
  sheetName  : 'CogDrisk_TW_總表',       // 總表試算表名稱
  timezone   : 'Asia/Taipei'
};

// ── 入口：POST 請求 ────────────────────────────────────────────────────────────
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000); // 避免並發寫入衝突
  try {
    const data = JSON.parse(e.postData.contents);
    const folder = getOrCreateFolder(CONFIG.folderName);
    saveJsonFile(data, folder);
    updateSummarySheet(data, folder);
    return ok('saved');
  } catch (err) {
    console.error('CogDrisk doPost error:', err);
    return ok('error: ' + err.message); // 仍回 200，避免 no-cors 被當失敗
  } finally {
    lock.releaseLock();
  }
}

// ── 入口：GET 請求（健康檢查）─────────────────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput('✅ CogDrisk-TW Apps Script is running. ' + new Date().toISOString())
    .setMimeType(ContentService.MimeType.TEXT);
}

function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 資料夾：取得或建立 ────────────────────────────────────────────────────────
function getOrCreateFolder(name) {
  const iter = DriveApp.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : DriveApp.createFolder(name);
}

// ── 個別 JSON 存檔 ─────────────────────────────────────────────────────────────
function saveJsonFile(data, folder) {
  const ts      = data.timestamp ? new Date(data.timestamp) : new Date();
  const dateStr = Utilities.formatDate(ts, CONFIG.timezone, 'yyyyMMdd_HHmmss');
  const age     = data.age ? data.age + 'y' : 'NA';
  const fileName = 'CogDrisk_' + age + '_' + dateStr + '.json';
  folder.createFile(fileName, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);
}

// ── 總表更新 ───────────────────────────────────────────────────────────────────
function updateSummarySheet(data, folder) {
  let ss;
  const files = folder.getFilesByName(CONFIG.sheetName);
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(CONFIG.sheetName);
    DriveApp.getFileById(ss.getId()).moveTo(folder);
    initHeaders(ss.getActiveSheet());
  }

  const sheet = ss.getSheets()[0];
  const ts    = data.timestamp ? new Date(data.timestamp) : new Date();

  // ── 計算風險旗標 ──────────────────────────────────────────────────────────
  const isi   = toNum(data.isi_total);
  const cesd  = toNum(data.cesd_total);
  const ipaq  = toNum(data.ipaq_met);
  const mind  = toNum(data.mind_score);
  const soc   = toNum(data.social_total);
  const alc   = toNum(data.alc_weekly);
  const vasc  = toNum(data.vasc_count);
  const alcCutoff = data.gender === 'female' ? 14 : 21;

  const flags = [
    vasc  >= 2                       ? '心血管' : '',
    isi   >= 8                       ? '睡眠'   : '',
    cesd  >= 10                      ? '情緒'   : '',
    ipaq  <  600                     ? '體能'   : '',
    mind  <  7                       ? '飲食'   : '',
    soc   >= 6                       ? '社交'   : '',
    data.smoke_status === 'current'  ? '吸菸'   : '',
    alc   >  alcCutoff               ? '飲酒'   : '',
    data.pest === 'yes'              ? '農藥'   : ''
  ].filter(Boolean);

  // ── 寫入一列 ──────────────────────────────────────────────────────────────
  sheet.appendRow([
    Utilities.formatDate(ts, CONFIG.timezone, 'yyyy-MM-dd HH:mm:ss'), // A 評估時間
    data.age          || '',   // B 年齡
    labelGender(data.gender),  // C 性別
    labelEdu(data.edu),        // D 教育程度
    data.bmi          || '',   // E BMI
    data.bmi_cat      || '',   // F BMI分類
    isi  !== 0 ? isi  : '',    // G ISI分數
    data.isi_level    || '',   // H ISI等級
    cesd !== 0 ? cesd : '',    // I CES-D分數
    data.cesd_level   || '',   // J CES-D等級
    ipaq !== 0 ? ipaq : '',    // K IPAQ MET
    data.ipaq_level   || '',   // L IPAQ等級
    mind !== 0 ? mind : '',    // M MIND分數
    data.mind_level   || '',   // N MIND等級
    soc  !== 0 ? soc  : '',    // O UCLA社交分數
    data.social_level || '',   // P 社交等級
    labelSmoke(data.smoke_status),   // Q 吸菸
    alc  !== 0 ? alc  : '',    // R 每週飲酒份數
    data.alc_level    || '',   // S 飲酒等級
    vasc !== 0 ? vasc : '',    // T 心血管因子數
    data.vasc_factors || '',   // U 心血管因子項目
    data.pest         || '',   // V 農藥暴露
    flags.length,              // W 風險領域數
    flags.join('、'),           // X 風險領域項目
    data.notes        || '',   // Y 備註
    data.version      || ''    // Z 版本
  ]);
}

// ── 初始化標題列 ───────────────────────────────────────────────────────────────
function initHeaders(sheet) {
  const headers = [
    '評估時間','年齡','性別','教育程度','BMI','BMI分類',
    'ISI失眠分數','ISI等級',
    'CES-D憂鬱分數','CES-D等級',
    'IPAQ體能MET','IPAQ等級',
    'MIND飲食分數','MIND等級',
    'UCLA社交分數','社交等級',
    '吸菸狀況','每週飲酒份數','飲酒等級',
    '心血管因子數','心血管因子項目',
    '農藥暴露',
    '風險領域數','風險領域項目',
    '備註','版本'
  ];
  sheet.setName('評估總表');
  sheet.appendRow(headers);
  const hdr = sheet.getRange(1, 1, 1, headers.length);
  hdr.setFontWeight('bold')
     .setBackground('#0f766e')
     .setFontColor('#ffffff')
     .setHorizontalAlignment('center')
     .setWrap(false);
  sheet.setFrozenRows(1);
  // 欄寬調整
  sheet.setColumnWidth(1, 165);   // 評估時間
  sheet.setColumnWidth(21, 200);  // 心血管因子項目
  sheet.setColumnWidth(24, 160);  // 風險領域項目
}

// ── 工具函式 ───────────────────────────────────────────────────────────────────
function toNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

function labelGender(g) {
  return { male:'男性', female:'女性', other:'其他/不透露' }[g] || (g || '');
}
function labelEdu(e) {
  return {
    primary:'國小', junior:'國中', senior:'高中/高職',
    college:'專科', university:'大學', postgrad:'碩士以上'
  }[e] || (e || '');
}
function labelSmoke(s) {
  return { current:'目前吸菸', former:'已戒菸', never:'從不吸菸' }[s] || (s || '');
}
