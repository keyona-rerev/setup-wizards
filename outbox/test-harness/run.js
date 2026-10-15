#!/usr/bin/env node
/**
 * Outbox local simulator.
 * Loads every .gs file of an Outbox project into one Node vm context (alphabetical order, like Apps Script),
 * with in-memory mocks of the Apps Script services, then calls runAllTests().
 * Nothing here touches Google. No mail is sent. No network is used.
 *
 * Usage: node run.js [path-to-project-dir] [filter]     e.g. node run.js ./master T04,T08
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const dir = path.resolve(process.argv[2] || path.join(__dirname, 'master'));
const filter = process.argv[3] || '';

/* ---------------- Spreadsheet mock ---------------- */
const SHEETS = {};            // id -> Spreadsheet
let sheetCounter = 0;
const TRASHED = {};

function colLetter(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

function parseUserEntered(v) {
  // Google parses strings written with setValue/setValues unless the cell is plain text.
  if (typeof v !== 'string') return v;
  if (v === '') return '';
  if (/^'/.test(v)) return v.slice(1);
  if (/^(TRUE|FALSE)$/i.test(v)) return v.toUpperCase() === 'TRUE';
  if (/^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v)) return Number(v);
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(v)) {
    const d = new Date(v.indexOf('T') > -1 || v.length === 10 ? v : v.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;
  }
  return v;
}

class Range {
  constructor(sheet, r, c, nr, nc) { this.s = sheet; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  _check() {
    if (this.r < 1 || this.c < 1 || this.nr < 1 || this.nc < 1) throw new Error('The coordinates or dimensions of the range are invalid.');
  }
  _inb() {
    if (this.r + this.nr - 1 > this.s.maxRows || this.c + this.nc - 1 > this.s.maxCols) throw new Error('The coordinates or dimensions of the range are invalid.');
  }
  getValues() {
    this._check();
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) {
        const v = this.s.cell(this.r + i, this.c + j);
        row.push(v === undefined || v === null ? '' : v);
      }
      out.push(row);
    }
    return out;
  }
  getValue() { return this.getValues()[0][0]; }
  getDisplayValues() { return this.getValues().map(r => r.map(v => v instanceof Date ? v.toISOString() : String(v))); }
  setValues(vals) {
    this._check(); this._inb();
    if (!Array.isArray(vals) || vals.length !== this.nr || vals.some(r => !Array.isArray(r) || r.length !== this.nc)) {
      throw new Error('The number of rows in the data does not match the number of rows in the range. The data has ' + (vals && vals.length) + ' but the range has ' + this.nr + '.');
    }
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.s.put(this.r + i, this.c + j, vals[i][j]);
    return this;
  }
  setValue(v) {
    this._check(); this._inb();
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.s.put(this.r + i, this.c + j, v);
    return this;
  }
  setNumberFormat(f) {
    this._check(); this._inb();
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.s.fmt[(this.r + i) + ',' + (this.c + j)] = f;
    return this;
  }
  getNumberFormat() { return this.s.fmt[this.r + ',' + this.c] || 'General'; }
  setNumberFormats(fs_) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.s.fmt[(this.r + i) + ',' + (this.c + j)] = fs_[i][j]; return this; }
  setFontWeight() { return this; }
  setWrapText() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  clearContent() {
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.s.data.delete((this.r + i) + ',' + (this.c + j));
    return this;
  }
  clear() { return this.clearContent(); }
  getRow() { return this.r; }
  getColumn() { return this.c; }
  getNumRows() { return this.nr; }
  getNumColumns() { return this.nc; }
  getA1Notation() { return colLetter(this.c) + this.r + (this.nr * this.nc > 1 ? ':' + colLetter(this.c + this.nc - 1) + (this.r + this.nr - 1) : ''); }
}

class Sheet {
  constructor(ss, name) {
    this.ss = ss; this.name = name; this.data = new Map(); this.fmt = {};
    this.maxRows = 1000; this.maxCols = 26; this.frozen = 0;
  }
  cell(r, c) { return this.data.get(r + ',' + c); }
  put(r, c, v) {
    const f = this.fmt[r + ',' + c];
    let val = v;
    if (v === null || v === undefined) val = '';
    else if (f === '@') { val = v instanceof Date ? v.toString() : String(v); }
    else if (typeof v === 'string') val = parseUserEntered(v);
    else if (typeof v === 'object' && !(v instanceof Date)) val = String(v);
    if (val === '') this.data.delete(r + ',' + c); else this.data.set(r + ',' + c, val);
  }
  getName() { return this.name; }
  getSheetId() { return this.id; }
  getParent() { return this.ss; }
  getRange(r, c, nr, nc) {
    if (typeof r === 'string') throw new Error('A1 notation is not supported by the simulator: ' + r);
    return new Range(this, r, c || 1, nr || 1, nc || 1);
  }
  getDataRange() { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getLastRow() { let m = 0; this.data.forEach((v, k) => { const r = +k.split(',')[0]; if (r > m) m = r; }); return m; }
  getLastColumn() { let m = 0; this.data.forEach((v, k) => { const c = +k.split(',')[1]; if (c > m) m = c; }); return m; }
  getMaxRows() { return this.maxRows; }
  getMaxColumns() { return this.maxCols; }
  appendRow(row) {
    const r = this.getLastRow() + 1;
    if (r > this.maxRows) this.maxRows = r;
    if (row.length > this.maxCols) this.maxCols = row.length;
    for (let j = 0; j < row.length; j++) this.put(r, j + 1, row[j]);
    return this;
  }
  deleteRow(n) {
    if (n < 1 || n > this.maxRows) throw new Error('Those rows are out of bounds.');
    const nd = new Map(), nf = {};
    this.data.forEach((v, k) => { const [r, c] = k.split(',').map(Number); if (r < n) nd.set(k, v); else if (r > n) nd.set((r - 1) + ',' + c, v); });
    Object.keys(this.fmt).forEach(k => { const [r, c] = k.split(',').map(Number); if (r < n) nf[k] = this.fmt[k]; else if (r > n) nf[(r - 1) + ',' + c] = this.fmt[k]; });
    this.data = nd; this.fmt = nf; this.maxRows -= 1;
    return this;
  }
  insertRowsAfter(after, n) { return this; }
  setFrozenRows(n) { this.frozen = n; return this; }
  getFrozenRows() { return this.frozen; }
  setColumnWidth() { return this; }
  autoResizeColumns() { return this; }
  hideSheet() { return this; }
  setTabColor() { return this; }
  clear() { this.data = new Map(); return this; }
  clearContents() { this.data = new Map(); return this; }
  getSheetValues(r, c, nr, nc) { return this.getRange(r, c, nr, nc).getValues(); }
}

class Spreadsheet {
  constructor(name) {
    this.id = 'sim-sheet-' + (++sheetCounter) + '-' + crypto.randomBytes(6).toString('hex');
    this.name = name; this.sheets = [];
    SHEETS[this.id] = this;
  }
  addSheet(name) { const s = new Sheet(this, name); s.id = this.sheets.length + 1; this.sheets.push(s); return s; }
  getId() { return this.id; }
  getName() { return this.name; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id + '/edit'; }
  getSheets() { return this.sheets.slice(); }
  getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }
  insertSheet(n) {
    if (n && this.getSheetByName(n)) throw new Error('A sheet with the name "' + n + '" already exists. Please enter another name.');
    return this.addSheet(n || 'Sheet' + (this.sheets.length + 1));
  }
  deleteSheet(s) { this.sheets = this.sheets.filter(x => x !== s); }
  flush() {}
}

function newSpreadsheet(name, id) {
  const ss = new Spreadsheet(name);
  if (id) { delete SHEETS[ss.id]; ss.id = id; SHEETS[id] = ss; }
  ss.addSheet('Sheet1');
  return ss;
}

const SpreadsheetApp = {
  create: (name) => newSpreadsheet(name),
  openById: (id) => { if (!SHEETS[id]) throw new Error('Unexpected error while getting the method or property openById on object SpreadsheetApp.'); if (TRASHED[id]) { /* trashed files still open in Google */ } return SHEETS[id]; },
  getActiveSpreadsheet: () => null,
  flush: () => {},
};

/* ---------------- Utilities ---------------- */
function toBytes(x) { return Array.from(typeof x === 'string' ? Buffer.from(x, 'utf8') : Buffer.from(x)).map(b => (b > 127 ? b - 256 : b)); }
function fmtParts(date, tz) {
  const o = { timeZone: tz || 'UTC', hourCycle: 'h23' };
  const get = (opts) => new Intl.DateTimeFormat('en-US', Object.assign({}, o, opts)).format(date);
  const p = {};
  new Intl.DateTimeFormat('en-US', Object.assign({}, o, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    .formatToParts(date).forEach(x => { p[x.type] = x.value; });
  p.eee = get({ weekday: 'short' }); p.eeee = get({ weekday: 'long' });
  p.mmm = get({ month: 'short' }); p.mmmm = get({ month: 'long' });
  return p;
}
function formatDate(date, tz, fmt) {
  if (!(date instanceof Date) || isNaN(date.getTime())) throw new Error('Invalid date passed to formatDate');
  const p = fmtParts(date, tz);
  const h24 = parseInt(p.hour, 10) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const map = {
    yyyy: p.year, MMMM: p.mmmm, MMM: p.mmm, MM: p.month, M: String(+p.month), dd: p.day, d: String(+p.day),
    HH: String(h24).padStart(2, '0'), H: String(h24), hh: String(h12).padStart(2, '0'), h: String(h12),
    mm: p.minute, ss: p.second, a: h24 < 12 ? 'AM' : 'PM', EEEE: p.eeee, EEE: p.eee,
  };
  return fmt.replace(/'([^']*)'|yyyy|MMMM|MMM|MM|M|dd|d|HH|H|hh|h|mm|ss|a|EEEE|EEE/g, (m, lit) => (lit !== undefined ? lit : map[m]));
}
const Utilities = {
  getUuid: () => crypto.randomUUID(),
  sleep: () => { /* never really sleeps in the simulator */ Utilities.__slept = (Utilities.__slept || 0) + 1; },
  formatDate,
  base64Encode: (x) => Buffer.from(typeof x === 'string' ? x : Buffer.from(x)).toString('base64'),
  base64Decode: (s) => toBytes(Buffer.from(s, 'base64')),
  base64EncodeWebSafe: (x) => Buffer.from(typeof x === 'string' ? x : Buffer.from(x)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
  base64DecodeWebSafe: (s) => {
    if (/[^A-Za-z0-9\-_=]/.test(s)) throw new Error('Invalid argument: ' + s);
    return toBytes(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  },
  computeHmacSha256Signature: (v, k) => toBytes(crypto.createHmac('sha256', typeof k === 'string' ? k : Buffer.from(k)).update(typeof v === 'string' ? v : Buffer.from(v)).digest()),
  computeDigest: (alg, v) => toBytes(crypto.createHash('sha256').update(typeof v === 'string' ? v : Buffer.from(v)).digest()),
  DigestAlgorithm: { SHA_256: 'SHA_256', MD5: 'MD5', SHA_1: 'SHA_1' },
  newBlob: (b) => ({ getDataAsString: () => Buffer.from(b).toString('utf8'), getBytes: () => b }),
  parseCsv: (text) => {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  },
};

/* ---------------- HtmlService ---------------- */
function makeOutput(content) {
  const o = {
    _c: String(content), _t: '', _meta: {},
    getContent() { return this._c; },
    setTitle(t) { this._t = t; return this; },
    getTitle() { return this._t; },
    addMetaTag(n, v) { this._meta[n] = v; return this; },
    setXFrameOptionsMode(m) { this._x = m; return this; },
    append(s) { this._c += s; return this; },
  };
  return o;
}
const HtmlService = {
  XFrameOptionsMode: { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' },
  createHtmlOutput: (c) => makeOutput(c),
  createTemplateFromFile: (name) => {
    const file = path.join(dir, name + '.html');
    if (!fs.existsSync(file)) throw new Error('Exception: Could not find the HTML file: ' + name);
    const src = fs.readFileSync(file, 'utf8');
    const t = {
      evaluate() {
        const self = this;
        const html = src.replace(/<\?(!?=)\s*([\s\S]*?)\s*\?>/g, (m, kind, expr) => {
          const fn = new Function('__t', 'with(__t){ return (' + expr + '); }');
          const v = fn(self);
          return v === undefined || v === null ? '' : String(v);
        });
        return makeOutput(html);
      },
    };
    return t;
  },
};

/* ---------------- Content, Cache, Properties, Lock ---------------- */
const ContentService = {
  MimeType: { JSON: 'JSON', TEXT: 'TEXT', JAVASCRIPT: 'JAVASCRIPT' },
  createTextOutput: (s) => ({ _c: String(s || ''), setMimeType(m) { this._m = m; return this; }, getContent() { return this._c; }, getMimeType() { return this._m; }, append(x) { this._c += x; return this; } }),
};
function cacheStore() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), put: (k, v) => { m.set(k, String(v)); }, remove: (k) => { m.delete(k); }, removeAll: (ks) => ks.forEach(k => m.delete(k)) };
}
const SCRIPT_CACHE = cacheStore();
const CacheService = { getScriptCache: () => SCRIPT_CACHE, getUserCache: () => SCRIPT_CACHE, getDocumentCache: () => SCRIPT_CACHE };
function propStore() {
  const m = {};
  return {
    getProperty: (k) => (k in m ? m[k] : null),
    setProperty: (k, v) => { m[k] = String(v); },
    setProperties: (o) => Object.keys(o).forEach(k => { m[k] = String(o[k]); }),
    deleteProperty: (k) => { delete m[k]; },
    getProperties: () => Object.assign({}, m),
    __touched: () => Object.keys(m).length,
  };
}
const SCRIPT_PROPS = propStore(), USER_PROPS = propStore();
const PropertiesService = { getScriptProperties: () => SCRIPT_PROPS, getUserProperties: () => USER_PROPS, getDocumentProperties: () => USER_PROPS };
let lockHeld = false;
const LockService = {
  getScriptLock: () => ({
    waitLock(ms) { if (lockHeld) throw new Error('Lock timeout: another process was holding the lock for too long.'); lockHeld = true; },
    tryLock(ms) { if (lockHeld) return false; lockHeld = true; return true; },
    hasLock() { return lockHeld; },
    releaseLock() { lockHeld = false; },
  }),
  getUserLock() { return LockService.getScriptLock(); },
};

/* ---------------- Triggers ---------------- */
let TRIGGERS = [];
let trigId = 0;
const ScriptApp = {
  getProjectTriggers: () => TRIGGERS.slice(),
  deleteTrigger: (t) => { TRIGGERS = TRIGGERS.filter(x => x !== t); },
  newTrigger: (fn) => {
    const spec = { fn, kind: 'clock' };
    const b = {
      timeBased() { return b; }, everyMinutes(n) { spec.every = n; return b; }, everyHours(n) { spec.hours = n; return b; },
      everyDays(n) { spec.days = n; return b; }, atHour(n) { return b; }, after(ms) { spec.after = ms; return b; }, nearMinute() { return b; },
      create() { const t = { getHandlerFunction: () => fn, getUniqueId: () => 'trg' + (++trigId), getTriggerSource: () => 'CLOCK', spec }; TRIGGERS.push(t); return t; },
    };
    return b;
  },
  getScriptId: () => 'sim-script-id',
  getService: () => ({ getUrl: () => '' }),
  getOAuthToken: () => 'sim-token',
};

/* ---------------- Gmail ---------------- */
const GMAIL = { sent: [], labels: [], aliases: [], searches: [] };
const GmailApp = {
  sendEmail(to, subject, body, opts) { GMAIL.sent.push({ to, subject, body, opts }); },
  getAliases: () => GMAIL.aliases.slice(),
  getMessageById: () => null,
  getUserLabelByName: (n) => (GMAIL.labels.indexOf(n) > -1 ? { getName: () => n } : null),
  createLabel: (n) => { GMAIL.labels.push(n); return { getName: () => n }; },
  search: (q, s, m) => { GMAIL.searches.push([q, s, m]); return []; },
  get __sent() { return GMAIL.sent; },
  get __labels() { return GMAIL.labels; },
  get __searches() { return GMAIL.searches; },
  get __aliases() { return GMAIL.aliases; },
  set __aliases(v) { GMAIL.aliases = v; },
  __reset() { GMAIL.sent = []; GMAIL.labels = []; GMAIL.aliases = []; GMAIL.searches = []; },
};
const MailApp = { sendEmail(...a) { GMAIL.sent.push({ via: 'MailApp', args: a }); }, getRemainingDailyQuota: () => 100 };

const DriveApp = { getFileById: (id) => ({ setTrashed: (v) => { TRASHED[id] = !!v; }, getId: () => id }) };
const Logger = { log: (...a) => { if (process.env.SIM_VERBOSE) console.log('[log]', ...a); }, __lines: [] };
const Session = { getActiveUser: () => ({ getEmail: () => 'sim-user@example.com' }), getScriptTimeZone: () => 'America/New_York', getEffectiveUser: () => ({ getEmail: () => 'sim-user@example.com' }) };
const UrlFetchApp = { fetch: () => { throw new Error('UrlFetchApp is blocked in the simulator (no network).'); } };

/* CardService: chainable stub. Any method returns the same proxy; build() returns it. */
function chain() {
  const fn = function () { return p; };
  const p = new Proxy(fn, { get: (t, k) => (k === Symbol.toPrimitive ? () => 'card' : k === 'then' ? undefined : p), apply: () => p });
  return p;
}
const CardService = chain();

/* ---------------- Build context ---------------- */
const sandbox = {
  SpreadsheetApp, Utilities, HtmlService, ContentService, CacheService, PropertiesService, LockService, ScriptApp,
  GmailApp, MailApp, DriveApp, Logger, Session, UrlFetchApp, CardService,
  console, setTimeout, clearTimeout,
  SIM_ENV: true,
};
// Run in the main realm so Date/Array/Object are the same classes in the mocks and in the project code.
Object.assign(globalThis, sandbox);
const ctx = null;

// Pre-registered sheets that real Google would already have.
const MASTER_ID = (fs.readFileSync(path.join(dir, 'Test.gs'), 'utf8').match(/MASTER_BOARD_ID\s*=\s*'([^']+)'/) || [])[1];
const masterBoard = newSpreadsheet('Outbox master board (simulated)', MASTER_ID);
masterBoard.addSheet('test_results').getRange(1, 1, 1, 7).setValues([['run_id', 'at', 'test_id', 'area', 'name', 'status', 'detail']]);
masterBoard.addSheet('test_mail');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.gs')).sort();
// Apps Script loads files in project order; alphabetical is the order this project uses.
files.forEach(f => {
  try { vm.runInThisContext(fs.readFileSync(path.join(dir, f), 'utf8'), { filename: f }); }
  catch (e) { console.error('Load error in ' + f + ': ' + (e && e.stack || e)); process.exit(2); }
});

const started = Date.now();
let summary;
try {
  summary = vm.runInThisContext('runAllTests(' + JSON.stringify(filter) + ')');
} catch (e) {
  console.error('runAllTests threw: ' + (e && e.stack || e));
  process.exit(3);
}
console.log(summary);

const rs = masterBoard.getSheetByName('test_results');
const rows = rs.getRange(2, 1, Math.max(0, rs.getLastRow() - 1) || 1, 7).getValues().filter(r => r[2]);
const bad = rows.filter(r => r[5] === 'fail');
if (bad.length) {
  console.log('\nFAILURES');
  bad.forEach(r => console.log('  ' + r[2] + ' ' + r[4] + '\n      ' + r[6]));
}
const skipped = rows.filter(r => r[5] === 'skip');
if (skipped.length) { console.log('\nSKIPPED'); skipped.forEach(r => console.log('  ' + r[2] + ' ' + r[6])); }
console.log('\n' + rows.length + ' tests, ' + (rows.length - bad.length - skipped.length) + ' passed, ' + bad.length + ' failed, ' + skipped.length + ' skipped. ' + ((Date.now() - started) / 1000).toFixed(1) + 's');
console.log('Real Gmail sends in simulator normal mode: ' + GMAIL.sent.length + ' (only the T00d pass-through test makes one, to the mock).');
process.exit(bad.length ? 1 : 0);
