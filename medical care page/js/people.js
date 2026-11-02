/* people.js - person data operations (no UI). */
(function (w) {
  function all() { return Store.data.people; }
  function get(id) { return all().find(function (p) { return p.id === id; }); }
  function nextId() {
    var max = all().reduce(function (m, p) { var n = parseInt(String(p.id).replace(/\D/g, ''), 10); return n > m ? n : m; }, 0);
    var id; do { max++; id = 'REG-' + String(max).padStart(6, '0'); } while (get(id));
    return id;
  }
  var FIELDS = ['fullName', 'nationalId', 'dob', 'gender', 'phone', 'email', 'address', 'emergencyName', 'emergencyPhone', 'bloodType', 'notes'];
  function create(v) {
    var p = { id: v.id, token: Store.newToken(), registeredAt: new Date().toISOString().slice(0, 10) };
    FIELDS.forEach(function (k) { p[k] = (v[k] || '').trim(); });
    Store.SECTIONS.forEach(function (k) { p[k] = []; });
    all().push(p); Store.save(Store.data); return p;
  }
  function update(id, v) { // id and medical sections are never touched
    var p = get(id); FIELDS.forEach(function (k) { p[k] = (v[k] || '').trim(); }); Store.save(Store.data); return p;
  }
  function remove(id) { Store.data.people = all().filter(function (p) { return p.id !== id; }); Store.save(Store.data); }
  function search(q, gender, sort) {
    q = (q || '').trim().toLowerCase();
    var list = all().filter(function (p) {
      return (!q || p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || String(p.nationalId || '').includes(q)) && (!gender || p.gender === gender);
    });
    var s = (sort || 'name-asc').split('-'), key = { name: 'fullName', id: 'id', dob: 'dob', reg: 'registeredAt' }[s[0]], dir = s[1] === 'desc' ? -1 : 1;
    return list.sort(function (a, b) { return String(a[key] || '').localeCompare(String(b[key] || '')) * dir; });
  }
  w.People = { all: all, get: get, nextId: nextId, create: create, update: update, remove: remove, search: search };
})(window);
