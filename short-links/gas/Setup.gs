/** Setup.gs: the Sheet menu and the one-time setup. Safe to run again. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Short Links')
    .addItem('1. Set up', 'setup')
    .addItem('2. Show my admin key', 'showAdminKey')
    .addItem('3. Make a new admin key', 'newAdminKey')
    .addToUi();
}

function setup() {
  var ss = SpreadsheetApp.getActive();
  ensureTab_(ss, 'Links', LINK_HEAD, [140, 420, 200, 70, 150, 70, 150]);
  ensureTab_(ss, 'Clicks', CLICK_HEAD, [160, 140, 320, 90]);
  var st = ensureTab_(ss, 'Settings', ['Key', 'Value'], [180, 420]);
  var cfg = {};
  if (st.getLastRow() >= 2) st.getRange(2, 1, st.getLastRow() - 1, 2).getValues().forEach(function (r) { cfg[r[0]] = true; });
  var rows = [];
  if (!cfg.BRAND) rows.push(['BRAND', '']);
  if (!cfg.FALLBACK_URL) rows.push(['FALLBACK_URL', '']);
  if (rows.length) st.getRange(st.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
  ss.getSheetByName('Links').getRange('B2:C').setNumberFormat('@');
  ss.getSheetByName('Clicks').getRange('B2:D').setNumberFormat('@');
  var first = ss.getSheetByName('Sheet1');
  if (first && ss.getSheets().length > 1 && first.getLastRow() === 0) ss.deleteSheet(first);
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', Utilities.getUuid().replace(/-/g, '').slice(0, 24));
  if (!Links.all().length) Links.add('hello', 'https://example.com', 'Sample link. Edit or delete me.');
  try { SpreadsheetApp.getUi().alert('Setup is done. Next: deploy the web app. Your admin key: Short Links menu, then "2. Show my admin key".'); } catch (e) {}
  return 'ok';
}

function ensureTab_(ss, name, head, widths) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#0D1F2D').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  }
  return sh;
}

function showAdminKey() {
  var key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  SpreadsheetApp.getUi().alert(key ? 'Your admin key:\n\n' + key + '\n\nPaste it on your admin page. Keep it private.' : 'No key yet. Run "1. Set up" first.');
}

function newAdminKey() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Make a new admin key? The old key stops working.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var key = Utilities.getUuid().replace(/-/g, '').slice(0, 24);
  PropertiesService.getScriptProperties().setProperty('ADMIN_KEY', key);
  ui.alert('Your new admin key:\n\n' + key);
}
