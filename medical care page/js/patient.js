/* patient.js - read-only health record page. Reads everything from the link itself; no storage, no editing code. */
(function () {
  var main = document.getElementById('main');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var nr = function (v) { return v ? esc(v) : '<span class="nr">غير مسجل</span>'; };
  var ndate = function (d) { if (!d) return nr(''); var t = new Date(d + 'T00:00:00'); return esc(isNaN(t) ? d : t.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })); };
  function message(title, text) { main.innerHTML = '<div class="empty"><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p></div>'; }
  function entryHtml(sec, e) {
    var def = Records.SECTIONS[sec];
    var lines = def.fields.filter(function (f) { return f.key !== def.title && f.type !== 'checkbox'; }).map(function (f) {
      return '<p><span class="lb">' + esc(f.label) + ':</span> ' + (f.type === 'date' ? ndate(e[f.key]) : nr(e[f.key])) + '</p>';
    }).join('');
    var badges = (e.chronic ? '<span class="badge chronic">مزمنة</span>' : '') + (e.status ? '<span class="badge">' + esc(e.status) + '</span>' : '') + (e.severity ? '<span class="badge' + (e.severity === 'شديدة' ? ' sev' : '') + '">' + esc(e.severity) + '</span>' : '');
    return '<div class="entry"><h3>' + esc(e[def.title]) + badges + '</h3>' + lines + '</div>';
  }
  function render(d) {
    var item = function (l, v) { return '<div><dt>' + l + '</dt><dd>' + v + '</dd></div>'; };
    main.innerHTML = '<h1>السجل الطبي</h1>' +
      '<div class="card"><h2 style="margin-bottom:12px">المعلومات الصحية الأساسية</h2><dl class="info">' + item('فصيلة الدم', nr(d.bloodType)) + item('ملاحظات صحية عامة', nr(d.notes)) + '</dl></div>' +
      Object.keys(Records.SECTIONS).map(function (sec) {
        var list = d[sec];
        return '<section class="card" aria-labelledby="h-' + sec + '"><h2 id="h-' + sec + '">' + Records.SECTIONS[sec].label + '</h2>' +
          (list.length ? list.map(function (e) { return entryHtml(sec, e); }).join('') : '<p class="nr">غير مسجل. القسم الفارغ لا يعني عدم وجود شيء يستحق الذكر.</p>') + '</section>';
      }).join('') + '<p class="warn">هذه المعلومات نسخة وقت إنشاء الرابط، وقد لا تعكس آخر تحديث للسجل. نموذج تجريبي ببيانات وهمية.</p>';
  }
  var h = location.hash.replace(/^#/, '');
  if (h.indexOf('d=') !== 0 || h.length < 4) message('الرابط غير صحيح', 'هذا الرابط لا يحتوي على بيانات. تأكد من مسح رمز QR الصحيح.');
  else Share.decode(h.slice(2)).then(render).catch(function (e) {
    message('تعذر فتح الرابط', e && e.message === 'nosupport' ? 'هذا المتصفح قديم ولا يدعم فتح الرابط. حدّث المتصفح وحاول مرة أخرى.' : 'الرابط غير صحيح أو ناقص. تأكد من نسخه كاملًا.');
  });
})();
