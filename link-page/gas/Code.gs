/**
 * Link Page (ReRev). One Google Sheet is the database. This script is the API.
 * Tabs: Page (Key, Value), Links (Label, URL, Active, Clicks, LastClick), Clicks (Time, Link, Referrer, Device)
 * Public actions: ping, page, click, view.
 */
var VERSION = '1.0.0';
var LINK_HEAD = ['Label', 'URL', 'Active', 'Clicks', 'LastClick'];
var CLICK_HEAD = ['Time', 'Link', 'Referrer', 'Device'];

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var a = p.action || 'ping';
    if (a === 'ping') return json_({ ok: true, version: VERSION });
    if (a === 'page') return json_(getPage_());
    if (a === 'click') return json_(logClick_(p.i, p.r, p.d));
    if (a === 'view') return json_(logView_(p.r, p.d));
    return json_({ ok: false, error: 'bad_action' });
  } catch (err) {
    Logger.log(String(err && err.stack || err));
    return json_({ ok: false, error: 'server_error' });
  }
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function tab_(n) { return SpreadsheetApp.getActive().getSheetByName(n); }
function isTrue_(v) { return v === true || /^(true|yes|1|y)$/i.test(String(v).trim()); }
function validUrl_(u) { return /^(https?:\/\/[^\s<>"']{3,2000}|mailto:[^\s<>"']{3,200}|tel:[+\d\s().-]{3,30})$/i.test(String(u || '').trim()); }
function validImg_(u) { return /^https:\/\/[^\s<>"']{3,2000}$/i.test(String(u || '').trim()); }
function validColor_(c) { return /^#[0-9a-fA-F]{6}$/.test(String(c || '').trim()); }

function config_() {
  var cfg = { TITLE: '', BIO: '', AVATAR_URL: '', ACCENT: '#1A9E9E', FOOTER: '' }, sh = tab_('Page');
  if (sh && sh.getLastRow() >= 2) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0]) cfg[String(r[0]).trim()] = String(r[1]).trim(); });
  if (!validImg_(cfg.AVATAR_URL)) cfg.AVATAR_URL = '';
  if (!validColor_(cfg.ACCENT)) cfg.ACCENT = '#1A9E9E';
  return cfg;
}
function getPage_() {
  var sh = tab_('Links'), links = [];
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(function (r, i) {
      if (String(r[0]).trim() && isTrue_(r[2]) && validUrl_(r[1])) links.push({ id: i + 2, label: String(r[0]).trim().slice(0, 120), url: String(r[1]).trim() });
    });
  }
  return { ok: true, config: config_(), links: links };
}
function dev_(d) { return /^(mobile|desktop|tablet)$/.test(String(d || '')) ? d : ''; }
function logClick_(id, ref, dev) {
  id = Number(id);
  var sh = tab_('Links');
  if (!sh || !(id >= 2) || id > sh.getLastRow()) return { ok: false, error: 'not_found' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: 'busy' };
  try {
    var now = new Date(), label = String(sh.getRange(id, 1).getValue());
    var cur = Number(sh.getRange(id, 4).getValue()) || 0;
    sh.getRange(id, 4, 1, 2).setValues([[cur + 1, now]]);
    tab_('Clicks').appendRow([now, label, String(ref || '').slice(0, 200), dev_(dev)]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}
function logView_(ref, dev) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: 'busy' };
  try { tab_('Clicks').appendRow([new Date(), '(page view)', String(ref || '').slice(0, 200), dev_(dev)]); return { ok: true }; }
  finally { lock.releaseLock(); }
}
