/**
 * Short Links (ReRev). One Google Sheet is the database. This script is the API.
 * Public actions: ping, go (look up a slug and log the click).
 * Admin actions need the admin key. The key lives in Script Properties, never in the Sheet.
 */
var VERSION = '1.0.0';

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || 'ping';
    if (action === 'ping') return json_({ ok: true, version: VERSION, ts: new Date().toISOString() });
    if (action === 'go') return json_(Links.go(p.s, { ref: p.r, dev: p.d, test: p.t === '1' }));
    return json_({ ok: false, error: 'bad_action' });
  } catch (err) {
    Logger.log(String(err && err.stack || err));
    return json_({ ok: false, error: 'server_error' });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'admin') return json_(Admin.handle(body));
    return json_({ ok: false, error: 'bad_action' });
  } catch (err) {
    Logger.log(String(err && err.stack || err));
    return json_({ ok: false, error: 'server_error' });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
