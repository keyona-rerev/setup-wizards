/**
 * Engine.gs: live availability and booking for ONE owner.
 * Nothing is cached. Every read is a live FreeBusy call. The owner and every extra calendar must be free.
 */
function fetchBusy_(c, startIso, endIso) {
  var res = UrlFetchApp.fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ timeMin: startIso, timeMax: endIso, timeZone: 'UTC', items: c.calendars.map(function (id) { return { id: id }; }) })
  });
  var body;
  try { body = JSON.parse(res.getContentText()); } catch (e) { throw new Error('Calendar answer was not readable.'); }
  if (res.getResponseCode() !== 200) throw new Error('Calendar request failed (' + res.getResponseCode() + ').');
  var busy = [];
  c.calendars.forEach(function (id) {
    var e = body.calendars && body.calendars[id];
    if (!e || (e.errors && e.errors.length)) throw new Error('CALENDAR_ACCESS: cannot read ' + id + '. No times are shown, so nobody is double booked.');
    (e.busy || []).forEach(function (b) { busy.push({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }); });
  });
  return busy;
}
function isFree_(c, busy, s, e) {
  var pad = c.padMinutes * 60000;
  for (var i = 0; i < busy.length; i++) if (busy[i].start < e + pad && busy[i].end > s - pad) return false;
  return true;
}
function candidates_(c) {
  var tz = c.timezone, now = new Date(), earliest = now.getTime() + c.minNoticeHours * 3600000;
  var today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var noon = Utilities.parseDate(today + ' 12:00', tz, 'yyyy-MM-dd HH:mm').getTime();
  var slotMs = c.slotMinutes * 60000, stepMs = c.stepMinutes * 60000, out = [];
  for (var d = 0; d <= c.windowDays; d++) {
    var day = new Date(noon + d * 86400000), ds = Utilities.formatDate(day, tz, 'yyyy-MM-dd');
    var dow = parseInt(Utilities.formatDate(day, tz, 'u'), 10), wins = c.hours[dow] || [];
    wins.forEach(function (w) {
      var ws = Utilities.parseDate(ds + ' ' + w[0], tz, 'yyyy-MM-dd HH:mm').getTime();
      var we = Utilities.parseDate(ds + ' ' + w[1], tz, 'yyyy-MM-dd HH:mm').getTime();
      for (var t = ws; t + slotMs <= we; t += stepMs) if (t >= earliest) out.push({ start: t, end: t + slotMs });
    });
  }
  return out;
}
function inHours_(c, s, e) {
  var tz = c.timezone, ds = Utilities.formatDate(s, tz, 'yyyy-MM-dd'), dow = parseInt(Utilities.formatDate(s, tz, 'u'), 10);
  return (c.hours[dow] || []).some(function (w) {
    return s.getTime() >= Utilities.parseDate(ds + ' ' + w[0], tz, 'yyyy-MM-dd HH:mm').getTime() && e.getTime() <= Utilities.parseDate(ds + ' ' + w[1], tz, 'yyyy-MM-dd HH:mm').getTime();
  });
}
function getSlots() {
  try {
    var c = Cfg.load(), cand = candidates_(c);
    if (!cand.length) return { ok: true, timezone: c.timezone, slotMinutes: c.slotMinutes, slots: [], fetchedAt: Date.now() };
    var minT = Math.min.apply(null, cand.map(function (x) { return x.start; })), maxT = Math.max.apply(null, cand.map(function (x) { return x.end; }));
    var busy = fetchBusy_(c, new Date(minT - 3600000).toISOString(), new Date(maxT + 3600000).toISOString());
    var slots = [];
    cand.forEach(function (x) {
      if (!isFree_(c, busy, x.start, x.end)) return;
      var d = new Date(x.start);
      slots.push({ startIso: d.toISOString(), dayKey: Utilities.formatDate(d, c.timezone, 'yyyy-MM-dd'), dayLabel: Utilities.formatDate(d, c.timezone, 'EEEE, MMMM d'), timeLabel: Utilities.formatDate(d, c.timezone, 'h:mm a'), assignedLabel: '' });
    });
    return { ok: true, timezone: c.timezone, slotMinutes: c.slotMinutes, slots: slots, fetchedAt: Date.now() };
  } catch (err) { return { ok: false, error: String(err.message || err) }; }
}
function verifySlot(startIso) {
  try {
    var c = Cfg.load(), s = new Date(startIso);
    if (isNaN(s.getTime())) return { ok: false, error: 'That time could not be read.' };
    var e = new Date(s.getTime() + c.slotMinutes * 60000);
    if (s.getTime() < Date.now() + c.minNoticeHours * 3600000) return { ok: false, error: 'That time is too soon to book. Pick a later one.' };
    if (!inHours_(c, s, e)) return { ok: false, error: 'That time is outside booking hours.' };
    var busy = fetchBusy_(c, new Date(s.getTime() - 3600000).toISOString(), new Date(e.getTime() + 3600000).toISOString());
    if (!isFree_(c, busy, s.getTime(), e.getTime())) return { ok: false, error: 'That time was just taken. Showing you the latest times.' };
    return { ok: true, assignedLabel: '' };
  } catch (err) { return { ok: false, error: String(err.message || err) }; }
}
function clean_(v, n) { v = String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function bookSlot(p) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'The system is handling another booking. Try again in a moment.' };
  try {
    if (!p || !p.startIso) return { ok: false, error: 'No time selected.' };
    var c = Cfg.load(), name = clean_(p.name, 100), email = String(p.email || '').trim().slice(0, 200);
    if (!name) return { ok: false, error: 'Name is required.' };
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' };
    var s = new Date(p.startIso);
    if (isNaN(s.getTime())) return { ok: false, error: 'That time could not be read.' };
    var e = new Date(s.getTime() + c.slotMinutes * 60000);
    if (s.getTime() < Date.now() + c.minNoticeHours * 3600000) return { ok: false, error: 'That time is too soon to book. Pick a later one.' };
    if (!inHours_(c, s, e)) return { ok: false, error: 'That time is outside booking hours.' };
    var busy = fetchBusy_(c, new Date(s.getTime() - 3600000).toISOString(), new Date(e.getTime() + 3600000).toISOString());
    if (!isFree_(c, busy, s.getTime(), e.getTime())) return { ok: false, error: 'That time was just taken. Please pick another.' };
    var cal = CalendarApp.getCalendarById(c.ownerEmail);
    if (!cal) return { ok: false, error: 'Could not open the calendar to write the event.' };
    var org = clean_(p.company, 150), notes = clean_(p.notes, 1000);
    var title = c.eventTitle.replace('{guestName}', name);
    var lines = ['Booked through your booking page.', '', 'Guest: ' + name + ' <' + email + '>'];
    if (org) lines.push('Organization: ' + org);
    if (notes) lines.push('', 'What they want to cover:', notes);
    var ev = cal.createEvent(title, s, e, { description: lines.join('\n'), location: c.eventLocation || '', guests: email, sendInvites: true });
    var meet = '';
    if (c.addMeet) {
      try {
        var id = ev.getId().split('@')[0];
        var r = Calendar.Events.patch({ conferenceData: { createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: 'hangoutsMeet' } } } }, c.ownerEmail, id, { conferenceDataVersion: 1, sendUpdates: 'all' });
        meet = (r && r.hangoutLink) || '';
      } catch (me) { Logger.log('Meet link failed: ' + me); }
    }
    var when = Utilities.formatDate(s, c.timezone, 'EEEE, MMMM d') + ' at ' + Utilities.formatDate(s, c.timezone, 'h:mm a') + ' ' + c.timezone;
    try {
      var log = SpreadsheetApp.getActive().getSheetByName('Bookings');
      if (log) log.appendRow([new Date(), s, name, email, org, notes, meet]);
    } catch (le) { Logger.log('Log failed: ' + le); }
    if (c.notifyOwner) {
      try { MailApp.sendEmail({ to: c.ownerEmail, subject: 'New booking: ' + title, body: ['New booking: ' + title, '', 'When: ' + when, 'Guest: ' + name + ' <' + email + '>'].concat(org ? ['Organization: ' + org] : [], notes ? ['', 'Notes: ' + notes] : [], meet ? ['', 'Meet: ' + meet] : [], ['', 'The event is already on your calendar.']).join('\n') }); }
      catch (me2) { Logger.log('Notify failed: ' + me2); }
    }
    return { ok: true, whenLabel: when, assignedLabel: '', meetLink: meet };
  } catch (err) {
    Logger.log(String(err && err.stack || err));
    return { ok: false, error: String(err.message || err) };
  } finally { try { lock.releaseLock(); } catch (x) {} }
}
