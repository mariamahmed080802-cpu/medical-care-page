/* storage.js - LocalStorage reading, saving and demo data. */
(function (w) {
  var KEY = 'medicalRegistry.v2';
  var SECTIONS = ['conditions', 'allergies', 'medications', 'surgeries', 'family'];
  var seq = 0;
  function newToken() { var a = new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function uid() { seq++; return 'e' + Date.now().toString(36) + seq + Math.random().toString(36).slice(2, 6); }
  function person(id, name, nid, dob, g, bt, reg, extra, s) {
    var p = { id: id, fullName: name, nationalId: nid, dob: dob, gender: g, phone: '', email: '', address: '', emergencyName: '', emergencyPhone: '', bloodType: bt, notes: '', registeredAt: reg, token: newToken() };
    Object.assign(p, extra || {});
    SECTIONS.forEach(function (k) { p[k] = ((s || {})[k] || []).map(function (e) { return Object.assign({ id: uid() }, e); }); });
    return p;
  }
  /* All names and national IDs below are fictional (governorate code 88 is used on purpose). */
  function demoData() {
    return { version: 2, settings: { compact: false }, people: [
      person('REG-000001', 'ليلى حداد', '28403128800011', '1984-03-12', 'أنثى', 'A+', '2026-09-02', { phone: '+20 100 555 0101', email: 'layla.demo@example.com', address: 'شارع تجريبي 12، مدينة تجريبية', emergencyName: 'عمر حداد', emergencyPhone: '+20 100 555 0102' },
        { conditions: [{ name: 'الربو', date: '1995-06-01', status: 'حالية', chronic: true, notes: 'نوبات موسمية.' }], allergies: [{ name: 'البنسلين', reaction: 'طفح جلدي', severity: 'متوسطة', notes: '' }], medications: [{ name: 'بخاخ سالبيوتامول', dosage: '100 ميكروجرام', frequency: 'عند الحاجة', start: '', end: '', notes: '' }], family: [{ name: 'السكري من النوع الثاني', relation: 'الأم', notes: '' }] }),
      person('REG-000002', 'سامي عبد الله', '27111308800022', '1971-11-30', 'ذكر', 'O-', '2026-09-15', { phone: '+20 100 555 0142', email: 'sami.demo@example.com', emergencyName: 'سارة عبد الله', emergencyPhone: '+20 100 555 0143' },
        { conditions: [{ name: 'ارتفاع ضغط الدم', date: '2015-02-10', status: 'حالية', chronic: true, notes: '' }, { name: 'التهاب رئوي', date: '2009-01-15', status: 'سابقة', chronic: false, notes: 'تم الشفاء تمامًا.' }], surgeries: [{ name: 'استئصال الزائدة الدودية', date: '1992-07-04', notes: '' }], medications: [{ name: 'أملوديبين', dosage: '5 مجم', frequency: 'يوميًا', start: '2015-03-01', end: '', notes: '' }] }),
      person('REG-000003', 'منى خليل', '29607228800033', '1996-07-22', 'أنثى', '', '2026-10-01', { email: 'mona.demo@example.com' },
        { allergies: [{ name: 'الفول السوداني', reaction: 'شرى جلدي', severity: 'شديدة', notes: '' }, { name: 'حبوب اللقاح', reaction: '', severity: '', notes: '' }] }),
      person('REG-000004', 'يوسف نبيل', '30201098800044', '2002-01-09', 'ذكر', 'B+', '2026-10-10', { notes: 'لا توجد ملاحظات إضافية.' }, {}),
      person('REG-000005', 'أميرة سعيد', '25805188800055', '1958-05-18', 'أخرى', 'AB+', '2026-10-17', { phone: '+20 100 555 0150' },
        { conditions: [{ name: 'خشونة المفاصل', date: '', status: 'حالية', chronic: true, notes: '' }], surgeries: [{ name: 'استبدال مفصل الركبة', date: '2019-09-12', notes: 'الركبة اليسرى.' }], family: [{ name: 'أمراض القلب', relation: 'الأب', notes: '' }] })
    ] };
  }
  function isValid(d) { return d && Array.isArray(d.people) && d.people.every(function (p) { return p && typeof p.id === 'string' && typeof p.fullName === 'string'; }); }
  function normalize(d) {
    d.settings = d.settings || {};
    d.people.forEach(function (p) { if (!p.token) p.token = newToken(); SECTIONS.forEach(function (k) { if (!Array.isArray(p[k])) p[k] = []; }); });
    return d;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var d = JSON.parse(raw); if (isValid(d)) { d = normalize(d); save(d); return d; } } } catch (e) { /* fall through to demo data */ }
    var fresh = demoData(); save(fresh); return fresh;
  }
  w.Store = { SECTIONS: SECTIONS, uid: uid, newToken: newToken, load: load, save: save, demoData: demoData, data: null };
  w.Store.data = load();
  w.Store.reset = function () { w.Store.data = demoData(); save(w.Store.data); };
})(window);
