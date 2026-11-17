/**
 * 폭스러닝센터 홈페이지 '문의하기' 폼 접수용 Google Apps Script.
 * 문의가 오면 이 스크립트가 붙어 있는 Google 시트에 한 줄을 추가하고, 알림 메일을 보낸다.
 *
 * 설치 (1회):
 *  1. 새 Google 시트를 만들고 확장 프로그램 → Apps Script 에 이 파일 내용을 붙여 넣는다.
 *  2. 아래 NOTIFY_EMAIL 을 알림 받을 주소로 바꾼다 (비워 두면 시트에만 기록).
 *  3. 배포 → 새 배포 → 웹 앱, 실행 사용자: 나, 액세스 권한: 모든 사용자.
 *  4. 나온 웹 앱 URL(…/exec)을 site.config.json 의 "contactEndpoint" 에 넣고 다시 배포한다.
 */
var NOTIFY_EMAIL = "";
var SHEET_NAME = "문의";

function doPost(e) {
  var p = (e && e.parameter) || {};
  var name = String(p.name || "").slice(0, 100);
  var phone = String(p.phone || "").slice(0, 50);
  var message = String(p.message || "").slice(0, 5000);
  if (!name || !phone || !message) return ContentService.createTextOutput("missing");

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(["접수 시각", "이름", "연락처", "문의 내용", "페이지"]);
  // 맨 앞의 = + - @ 는 수식으로 실행되지 않도록 작은따옴표를 붙인다.
  var safe = function (s) { return /^[=+\-@]/.test(s) ? "'" + s : s; };
  sheet.appendRow([new Date(), safe(name), safe(phone), safe(message), String(p.page || "").slice(0, 300)]);

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, "[폭스러닝센터] 홈페이지 문의: " + name,
      "이름: " + name + "\n연락처: " + phone + "\n\n" + message);
  }
  return ContentService.createTextOutput("ok");
}
