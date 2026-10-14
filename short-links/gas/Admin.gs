/** Admin.gs: actions behind the admin key. */
var Admin = {
  handle: function (b) {
    var key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
    if (!key || !b.key || String(b.key) !== key) { Utilities.sleep(800); return { ok: false, error: 'unauthorized' }; }
    switch (b.op) {
      case 'list': return { ok: true, links: Links.all().map(pub_), daily: Links.daily('', 30) };
      case 'add': return Links.add(b.slug, b.dest, b.label);
      case 'update': return Links.update(String(b.slug || '').toLowerCase(), { dest: b.dest, label: b.label, active: b.active });
      case 'delete': return Links.remove(String(b.slug || '').toLowerCase());
      case 'stats': return { ok: true, daily: Links.daily(String(b.slug || '').toLowerCase(), 30) };
      default: return { ok: false, error: 'bad_op' };
    }
  }
};
function pub_(l) { return { slug: l.slug, dest: l.dest, label: l.label, active: l.active, clicks: l.clicks, last: l.last ? new Date(l.last).toISOString() : '' }; }
