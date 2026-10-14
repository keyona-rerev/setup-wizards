/** Setup.gs: Sheet menu and one-time setup. Safe to run again. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Link Page').addItem('1. Set up', 'setup').addToUi();
}
function setup() {
  var ss = SpreadsheetApp.getActive();
  var pg = ensureTab_(ss, 'Page', ['Key', 'Value'], [160, 460]);
  var have = {};
  if (pg.getLastRow() >= 2) pg.getRange(2, 1, pg.getLastRow() - 1, 1).getValues().forEach(function (r) { have[r[0]] = true; });
  var rows = [['TITLE', 'My Business'], ['BIO', 'Short line about what you do.'], ['AVATAR_URL', ''], ['ACCENT', '#1A9E9E'], ['FOOTER', '']].filter(function (r) { return !have[r[0]]; });
  if (rows.length) pg.getRange(pg.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
  var ln = ensureTab_(ss, 'Links', LINK_HEAD, [220, 420, 70, 70, 150]);
  ensureTab_(ss, 'Clicks', CLICK_HEAD, [160, 220, 320, 90]);
  if (ln.getLastRow() < 2) ln.getRange(2, 1, 2, 3).setValues([['Visit my website', 'https://example.com', true], ['Email me', 'mailto:you@example.com', true]]);
  var first = ss.getSheetByName('Sheet1');
  if (first && ss.getSheets().length > 1 && first.getLastRow() === 0) ss.deleteSheet(first);
  try { SpreadsheetApp.getUi().alert('Setup is done. Edit the Page and Links tabs. Next: deploy the web app.'); } catch (e) {}
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
