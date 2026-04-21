/**
 * CogDrisk-TW Google Apps Script  v2.0
 * ──────────────────────────────────────────────────────────────────────────────
 * Google Drive 資料夾結構：
 *   CogDrisk-TW評估資料/
 *     ├── CogDrisk_65y_20260421_143522.json   ← 個別評估原始資料
 *     ├── CogDrisk_72y_20260422_091015.json
 *     ├── 所有個案彙總報表.csv                 ← 每次評估後自動更新
 *     └── CogDrisk_TW_總表  (Google Sheets)   ← 格式化總表
 *
 * 更新腳本後需重新部署（部署 → 管理部署 → 編輯 → 版本選「新版本」→ 部署）
 * ──────────────────────────────────────────────────────────────────────────────
 */

const FOLDER_NAME = 'CogDrisk-TW評估資料';   // ← 獨立資料夾，與失智診斷分開
const SHEET_NAME  = 'CogDrisk_TW_總表';
const CSV_NAME    = '所有個案彙總報表.csv';
const TZ          = 'Asia/Taipei';

// ── POST 入口 ─────────────────────────────────────────────────────────────────
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const data   = JSON.parse(e.postData.contents);
    const folder = getOrCreateFolder(FOLDER_NAME);
    saveJsonFile(data, folder);
    const ss = updateSummarySheet(data, folder);
    generateCSV(ss, folder);
    return ok('saved');
  } catch (err) {
    console.error('doPost error:', err);
    return ok('error: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

// ── GET 健康檢查 ──────────────────────────────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput('✅ CogDrisk-TW Apps Script v2.0 running. ' + new Date().toISOString())
    .setMimeType(ContentService.MimeType.TEXT);
}

function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 資料夾取得或建立 ──────────────────────────────────────────────────────────
function getOrCreateFolder(name) {
  const iter = DriveApp.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : DriveApp.createFolder(name);
}

// ── 個別 JSON 存檔 ────────────────────────────────────────────────────────────
function saveJsonFile(data, folder) {
  const ts      = data.timestamp ? new Date(data.timestamp) : new Date();
  const dateStr = Utilities.formatDate(ts, TZ, 'yyyyMMdd_HHmmss');
  const age     = data.age ? data.age + 'y' : 'NA';
  const name    = 'CogDrisk_' + age + '_' + dateStr + '.json';
  folder.createFile(name, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);
}

// ── Google Sheets 總表更新 ────────────────────────────────────────────────────
function updateSummarySheet(data, folder) {
  var ss;
  const files = folder.getFilesByName(SHEET_NAME);
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SHEET_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(folder);
    initHeaders(ss.getActiveSheet());
  }
  ss.getSheets()[0].appendRow(buildRow(data));
  return ss;
}

// ── CSV 彙總報表（每次評估後從 Sheets 重新產生）──────────────────────────────
function generateCSV(ss, folder) {
  const sheet  = ss.getSheets()[0];
  const values = sheet.getDataRange().getValues();

  // UTF-8 BOM 讓 Excel 正確顯示中文
  const BOM = '\uFEFF';
  const csv = BOM + values.map(function(row) {
    return row.map(function(cell) {
      var s = (cell instanceof Date)
        ? Utilities.formatDate(cell, TZ, 'yyyy-MM-dd HH:mm:ss')
        : String(cell);
      // 含逗號、引號或換行則加雙引號包住
      if (s.indexOf(',') > -1 || s.indexOf('"') > -1 || s.indexOf('\n') > -1) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
  }).join('\n');

  // 刪除舊 CSV，建立新 CSV
  const old = folder.getFilesByName(CSV_NAME);
  while (old.hasNext()) old.next().setTrashed(true);
  folder.createFile(CSV_NAME, csv, MimeType.CSV);
}

// ── 建立一筆資料列 ────────────────────────────────────────────────────────────
function buildRow(data) {
  var ts     = data.timestamp ? new Date(data.timestamp) : new Date();
  var isi    = toN(data.isi_total),  cesd = toN(data.cesd_total);
  var ipaq   = toN(data.ipaq_met),   mind = toN(data.mind_score);
  var soc    = toN(data.social_total), alc = toN(data.alc_weekly);
  var vasc   = toN(data.vasc_count);
  var alcCut = (data.gender === 'female') ? 14 : 21;
  var flags  = [
    vasc >= 2                      ? '心血管' : '',
    isi  >= 8                      ? '睡眠'   : '',
    cesd >= 10                     ? '情緒'   : '',
    ipaq <  600                    ? '體能'   : '',
    mind <  7                      ? '飲食'   : '',
    soc  >= 6                      ? '社交'   : '',
    data.smoke_status === 'current' ? '吸菸'  : '',
    alc  > alcCut                  ? '飲酒'   : '',
    data.pest === 'yes'            ? '農藥'   : ''
  ].filter(Boolean);

  return [
    Utilities.formatDate(ts, TZ, 'yyyy-MM-dd HH:mm:ss'),
    data.age      || '',  lGender(data.gender),  lEdu(data.edu),
    data.bmi      || '',  data.bmi_cat    || '',
    isi  || '',  data.isi_level   || '',
    cesd || '',  data.cesd_level  || '',
    ipaq || '',  data.ipaq_level  || '',
    mind || '',  data.mind_level  || '',
    soc  || '',  data.social_level|| '',
    lSmoke(data.smoke_status),
    alc  || '',  data.alc_level   || '',
    vasc || '',  data.vasc_factors|| '',
    data.pest     || '',
    flags.length,  flags.join('、'),
    data.notes    || '',  data.version   || ''
  ];
}

// ── 初始化標題列 ──────────────────────────────────────────────────────────────
function initHeaders(sheet) {
  var headers = [
    '評估時間','年齡','性別','教育程度','BMI','BMI分類',
    'ISI失眠分數','ISI等級','CES-D憂鬱分數','CES-D等級',
    'IPAQ體能MET','IPAQ等級','MIND飲食分數','MIND等級',
    'UCLA社交分數','社交等級','吸菸狀況','每週飲酒份數','飲酒等級',
    '心血管因子數','心血管因子項目','農藥暴露',
    '風險領域數','風險領域項目','備註','版本'
  ];
  sheet.setName('評估總表');
  sheet.appendRow(headers);
  var hdr = sheet.getRange(1, 1, 1, headers.length);
  hdr.setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff')
     .setHorizontalAlignment('center').setWrap(false);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 165);
  sheet.setColumnWidth(21, 200);
  sheet.setColumnWidth(24, 160);
}

// ── 工具函式 ──────────────────────────────────────────────────────────────────
function toN(v)      { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function lGender(g)  { return {male:'男性',female:'女性',other:'其他/不透露'}[g] || (g||''); }
function lEdu(e)     { return {primary:'國小',junior:'國中',senior:'高中/高職',college:'專科',university:'大學',postgrad:'碩士以上'}[e] || (e||''); }
function lSmoke(s)   { return {current:'目前吸菸',former:'已戒菸',never:'從不吸菸'}[s] || (s||''); }
