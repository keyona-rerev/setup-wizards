/**
 * Links.gs: reads and writes the Links and Clicks tabs.
 * Links columns: Slug, Destination, Label, Active, Created, Clicks, LastClick
 * Clicks columns: Time, Slug, Referrer, Device
 */
var LINK_HEAD = ['Slug', 'Destination', 'Label', 'Active', 'Created', 'Clicks', 'LastClick'];
var CLICK_HEAD = ['Time', 'Slug', 'Referrer', 'Device'];
var SLUG_RE = /^[A-Za-z0-9_-]{1,40}$/;
var RESERVED = ['admin', 'index', 'api', 'qr', 'static', 'assets'];

function ss_() { return SpreadsheetApp.getActive(); }
function tab_(name) { return ss_().getSheetByName(name); }
function safe_(v) { v = v == null ? '' : String(v); return v; }
function validUrl_(u) { return /^https?:\/\/[^\s<>"']{3,2000}$/i.test(String(u || '').trim()); }
function isTrue_(v) { return v === true || /^(true|yes|1|y)$/i.test(String(v).trim()); }

var Links = {
  /** All link rows as objects, with the sheet row number. */
  all: function () {
    var sh = tab_('Links');
    if (!sh || sh.getLastRow() < 2) return [];
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues();
    return vals.map(function (r, i) {
      return { row: i + 2, slug: String(r[0]).trim().toLowerCase(), dest: String(r[1]).trim(), label: String(r[2]), active: isTrue_(r[3]), created: r[4], clicks: Number(r[5]) || 0, last: r[6] };
    }).filter(function (x) { return x.slug; });
  },

  find: function (slug) {
    slug = String(slug || '').trim().toLowerCase();
    var all = this.all();
    for (var i = 0; i < all.length; i++) if (all[i].slug === slug) return all[i];
    return null;
  },

  /** Public: look up a slug, return the destination and log the click. */
  go: function (slug, opts) {
    opts = opts || {};
    slug = String(slug || '').trim().toLowerCase();
    var cfg = Settings.get();
    if (!SLUG_RE.test(slug)) return { ok: false, error: 'not_found', fallback: cfg.FALLBACK_URL, brand: cfg.BRAND };
    var link = this.find(slug);
    if (!link || !link.active || !validUrl_(link.dest)) return { ok: false, error: 'not_found', fallback: cfg.FALLBACK_URL, brand: cfg.BRAND };
    if (!opts.test) this.logClick_(link, opts);
    return { ok: true, url: link.dest };
  },

  logClick_: function (link, opts) {
    var lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(5000)) return;
      var now = new Date();
      var sh = tab_('Links');
      var cur = Number(sh.getRange(link.row, 6).getValue()) || 0;
      sh.getRange(link.row, 6, 1, 2).setValues([[cur + 1, now]]);
      var ref = String(opts.ref || '').slice(0, 200);
      var dev = /^(mobile|desktop|tablet)$/.test(String(opts.dev || '')) ? opts.dev : '';
      tab_('Clicks').appendRow([now, link.slug, ref, dev]);
    } catch (err) {
      Logger.log('logClick_ ' + err);
    } finally {
      try { lock.releaseLock(); } catch (e2) {}
    }
  },

  randomSlug_: function () {
    var chars = 'abcdefghijkmnpqrstuvwxyz23456789', s = '';
    for (var i = 0; i < 6; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  },

  add: function (slug, dest, label) {
    dest = String(dest || '').trim();
    if (!validUrl_(dest)) return { ok: false, error: 'bad_destination' };
    slug = String(slug || '').trim().toLowerCase();
    if (!slug) { for (var t = 0; t < 20 && (!slug || this.find(slug)); t++) slug = this.randomSlug_(); }
    if (!SLUG_RE.test(slug)) return { ok: false, error: 'bad_slug' };
    if (RESERVED.indexOf(slug) >= 0) return { ok: false, error: 'reserved_slug' };
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return { ok: false, error: 'busy' };
    try {
      if (this.find(slug)) return { ok: false, error: 'slug_taken' };
      tab_('Links').appendRow([slug, dest, safe_(label).slice(0, 120), true, new Date(), 0, '']);
      return { ok: true, slug: slug };
    } finally { lock.releaseLock(); }
  },

  update: function (slug, fields) {
    var link = this.find(slug);
    if (!link) return { ok: false, error: 'not_found' };
    var sh = tab_('Links');
    if (fields.dest !== undefined) {
      if (!validUrl_(fields.dest)) return { ok: false, error: 'bad_destination' };
      sh.getRange(link.row, 2).setValue(String(fields.dest).trim());
    }
    if (fields.label !== undefined) sh.getRange(link.row, 3).setValue(safe_(fields.label).slice(0, 120));
    if (fields.active !== undefined) sh.getRange(link.row, 4).setValue(!!fields.active);
    return { ok: true };
  },

  remove: function (slug) {
    var link = this.find(slug);
    if (!link) return { ok: false, error: 'not_found' };
    tab_('Links').deleteRow(link.row);
    return { ok: true };
  },

  /** Clicks per day for the last N days. slug is optional. */
  daily: function (slug, days) {
    var sh = tab_('Clicks');
    var out = {}, n = sh ? sh.getLastRow() - 1 : 0;
    var tz = Session.getScriptTimeZone();
    var start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
    for (var d = 0; d < days; d++) { var x = new Date(start); x.setDate(start.getDate() + d); out[Utilities.formatDate(x, tz, 'yyyy-MM-dd')] = 0; }
    if (n > 0) {
      var from = Math.max(2, sh.getLastRow() - 19999);
      var vals = sh.getRange(from, 1, sh.getLastRow() - from + 1, 2).getValues();
      vals.forEach(function (r) {
        if (!(r[0] instanceof Date) || r[0] < start) return;
        if (slug && String(r[1]).toLowerCase() !== slug) return;
        var k = Utilities.formatDate(r[0], tz, 'yyyy-MM-dd');
        if (k in out) out[k]++;
      });
    }
    return Object.keys(out).sort().map(function (k) { return { day: k, clicks: out[k] }; });
  }
};

var Settings = {
  get: function () {
    var cache = CacheService.getScriptCache(), hit = cache.get('settings');
    if (hit) return JSON.parse(hit);
    var cfg = { BRAND: '', FALLBACK_URL: '' }, sh = tab_('Settings');
    if (sh && sh.getLastRow() >= 2) {
      sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0]) cfg[String(r[0]).trim()] = String(r[1]).trim(); });
    }
    if (!validUrl_(cfg.FALLBACK_URL)) cfg.FALLBACK_URL = '';
    try { cache.put('settings', JSON.stringify(cfg), 60); } catch (e) {}
    return cfg;
  }
};
