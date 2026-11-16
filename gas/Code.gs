/**
 * Google Apps Script (GAS) 與綁定 Google 試算表同步範例
 * 使用方式：
 * 1. 開啟綁定的 Google 試算表 ->「擴充功能」->「Apps Script」
 * 2. 將此程式碼貼入 Code.gs，試算表建立名為「SDGs」的工作表
 *    欄位依序為：id | code | title | enTitle | color | faIcon | icon | description | targetsJson
 * 3. 部署為「網頁應用程式」，將產生的 URL 填入 js/app.js 的 GAS_WEB_APP_URL 即可同步。
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('SDGs');
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = rows[0];
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue;
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).trim();
      var val = row[j];
      if (key === 'targetsJson') {
        try {
          item.targets = JSON.parse(val || '[]');
        } catch (err) {
          item.targets = [];
        }
      } else if (key === 'id') {
        item.id = Number(val);
      } else {
        item[key] = val;
      }
    }
    result.push(item);
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
