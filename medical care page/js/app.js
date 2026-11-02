/* app.js - UI rendering, routing and event handling (Arabic / RTL). */
(function () {
  var main = document.getElementById('main'), modal = document.getElementById('modal');
  var ui = { q: '', gender: '', sort: 'name-asc' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var nr = function (v) { return v ? esc(v) : '<span class="nr">غير مسجل</span>'; };
  var fdate = function (d) { var t = new Date(d + 'T00:00:00'); return isNaN(t) ? d : t.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }); };
  var ndate = function (d) { return d ? esc(fdate(d)) : nr(''); };
  var GENDERS = ['أنثى', 'ذكر', 'أخرى'];

  function toast(msg, type) {
    var t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg;
    document.getElementById('toasts').appendChild(t); setTimeout(function () { t.remove(); }, 3500);
  }
  function openModal(html) { modal.innerHTML = html; if (!modal.open) modal.showModal(); }
  function confirmBox(title, msg, label) {
    return new Promise(function (resolve) {
      openModal('<h2>' + esc(title) + '</h2><p>' + esc(msg) + '</p><div class="row"><button class="btn danger" id="c-ok">' + esc(label) + '</button><button class="btn sec" id="c-no">إلغاء</button></div>');
      var done = function (v) { modal.onclose = null; if (modal.open) modal.close(); resolve(v); };
      document.getElementById('c-ok').onclick = function () { done(true); };
      document.getElementById('c-no').onclick = function () { done(false); };
      modal.onclose = function () { resolve(false); };
    });
  }

  /* ---------- form helpers ---------- */
  function field(f, v, errs) {
    var id = 'f-' + f.key, val = v[f.key], bad = errs && errs[f.key], h;
    if (f.type === 'checkbox') return '<div class="field check"><input type="checkbox" id="' + id + '" name="' + f.key + '"' + (val ? ' checked' : '') + '><label for="' + id + '">' + esc(f.label) + '</label></div>';
    var attrs = ' id="' + id + '" name="' + f.key + '"' + (f.readonly ? ' readonly' : '') + (f.key === 'nationalId' ? ' maxlength="14" inputmode="numeric" autocomplete="off"' : '') + (bad ? ' aria-invalid="true" aria-describedby="' + id + '-e"' : '');
    if (f.type === 'select') h = '<select' + attrs + '><option value="">' + (f.req ? 'اختر...' : 'غير مسجل') + '</option>' + f.options.map(function (o) { return '<option' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    else if (f.type === 'textarea') h = '<textarea' + attrs + '>' + esc(val) + '</textarea>';
    else h = '<input type="' + (f.type || 'text') + '"' + attrs + ' value="' + esc(val) + '">';
    return '<div class="field' + (bad ? ' bad' : '') + '"><label for="' + id + '"' + (f.req ? ' class="req"' : '') + '>' + esc(f.label) + '</label>' + h + (bad ? '<div class="err" id="' + id + '-e">' + esc(bad) + '</div>' : '') + '</div>';
  }
  function formValues(form) { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); Array.prototype.forEach.call(form.querySelectorAll('input[type=checkbox]'), function (c) { o[c.name] = c.checked; }); return o; }

  /* ---------- views ---------- */
  function dashboardView() {
    var s = Dashboard.stats();
    var card = function (n, l) { return '<div class="stat"><b>' + n + '</b><span>' + l + '</span></div>'; };
    return '<h1>لوحة المعلومات</h1><p class="sub">نظرة عامة على السجل، محسوبة من البيانات المحفوظة.</p>' +
      '<div class="grid stats">' + card(s.people, 'أشخاص مسجلون') + card(s.conditions, 'حالات مرضية مسجلة') + card(s.chronic, 'أشخاص لديهم حالات مزمنة') + card(s.allergies, 'أشخاص لديهم حساسية مسجلة') + '</div>' +
      '<div class="row" style="margin-bottom:18px"><a class="btn" href="#/people/new">تسجيل شخص</a><a class="btn sec" href="#/people">تصفح السجلات</a></div>' +
      '<div class="card"><h2>آخر المسجلين</h2>' + (s.recent.length ? '<div class="tablewrap"><table><thead><tr><th>رقم السجل</th><th>الاسم الكامل</th><th>تاريخ التسجيل</th><th></th></tr></thead><tbody>' +
      s.recent.map(function (p) { return '<tr><td>' + esc(p.id) + '</td><td>' + esc(p.fullName) + '</td><td>' + ndate(p.registeredAt) + '</td><td><a class="btn sm sec" href="#/people/' + esc(p.id) + '">عرض</a></td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">لا يوجد أشخاص مسجلون بعد.</div>') + '</div>';
  }
  function registryView() {
    var sorts = [['name-asc', 'الاسم (أ - ي)'], ['name-desc', 'الاسم (ي - أ)'], ['id-asc', 'رقم السجل'], ['reg-desc', 'الأحدث تسجيلًا'], ['reg-asc', 'الأقدم تسجيلًا'], ['dob-asc', 'تاريخ الميلاد (الأكبر سنًا)']];
    return '<div class="row between"><div><h1>سجل الأشخاص</h1><p class="sub">ابحث وصفِّ وأدر الأشخاص المسجلين.</p></div><a class="btn" href="#/people/new">تسجيل شخص</a></div>' +
      '<div class="tools"><input type="search" id="q" aria-label="بحث بالاسم أو رقم السجل أو الرقم القومي" placeholder="ابحث بالاسم أو رقم السجل أو الرقم القومي" value="' + esc(ui.q) + '">' +
      '<select id="g" aria-label="تصفية حسب النوع"><option value="">كل الأنواع</option>' + GENDERS.map(function (g) { return '<option' + (ui.gender === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select>' +
      '<select id="s" aria-label="ترتيب السجلات">' + sorts.map(function (s) { return '<option value="' + s[0] + '"' + (ui.sort === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="card tablewrap"><table><thead><tr><th>رقم السجل</th><th>الاسم الكامل</th><th>الرقم القومي</th><th>تاريخ الميلاد</th><th>النوع</th><th>فصيلة الدم</th><th>تاريخ التسجيل</th><th>الإجراءات</th></tr></thead><tbody id="rows"></tbody></table><div id="none" class="empty" hidden>لا توجد سجلات مطابقة للبحث. امسح البحث أو سجّل شخصًا جديدًا.</div></div>';
  }
  function renderRows() {
    var list = People.search(ui.q, ui.gender, ui.sort);
    document.getElementById('rows').innerHTML = list.map(function (p) {
      return '<tr><td>' + esc(p.id) + '</td><td>' + esc(p.fullName) + '</td><td>' + nr(p.nationalId) + '</td><td>' + ndate(p.dob) + '</td><td>' + nr(p.gender) + '</td><td>' + nr(p.bloodType) + '</td><td>' + ndate(p.registeredAt) + '</td>' +
        '<td class="act"><a class="btn sm sec" href="#/people/' + esc(p.id) + '">عرض</a><a class="btn sm sec" href="#/people/' + esc(p.id) + '/edit">تعديل</a><button class="btn sm sec danger" data-act="del-person" data-id="' + esc(p.id) + '">حذف</button></td></tr>';
    }).join('');
    document.getElementById('none').hidden = list.length > 0;
  }
  var PF = [
    { g: 'البيانات الشخصية', f: [{ key: 'id', label: 'رقم السجل', readonly: true }, { key: 'fullName', label: 'الاسم الكامل', req: true }, { key: 'nationalId', label: 'الرقم القومي (14 رقمًا)', req: true }, { key: 'dob', label: 'تاريخ الميلاد', type: 'date', req: true }, { key: 'gender', label: 'النوع', type: 'select', options: GENDERS, req: true }, { key: 'phone', label: 'رقم الهاتف', type: 'tel' }, { key: 'email', label: 'البريد الإلكتروني', type: 'email' }, { key: 'address', label: 'العنوان' }, { key: 'emergencyName', label: 'اسم جهة الاتصال للطوارئ' }, { key: 'emergencyPhone', label: 'هاتف جهة الاتصال للطوارئ', type: 'tel' }] },
    { g: 'المعلومات الصحية الأساسية', f: [{ key: 'bloodType', label: 'فصيلة الدم', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }, { key: 'notes', label: 'ملاحظات صحية عامة (اختياري)', type: 'textarea' }] }
  ];
  function personForm(id, v, errs) {
    var editing = !!id;
    return '<h1>' + (editing ? 'تعديل بيانات شخص' : 'تسجيل شخص') + '</h1><p class="sub">الحقول المميزة بعلامة * إلزامية. يمكن إضافة التاريخ الطبي لاحقًا من الملف الشخصي. استخدم بيانات وهمية فقط.</p>' +
      '<form data-form="person" data-id="' + esc(id || '') + '" novalidate>' + PF.map(function (s) { return '<fieldset><legend>' + s.g + '</legend><div class="cols">' + s.f.map(function (f) { return field(f, v, errs); }).join('') + '</div></fieldset>'; }).join('') +
      '<div class="row"><button class="btn" type="submit">' + (editing ? 'حفظ التغييرات' : 'تسجيل الشخص') + '</button><a class="btn sec" href="#/' + (editing ? 'people/' + esc(id) : 'people') + '">إلغاء</a></div></form>';
  }
  function fillLink(p) {
    Share.link(p).then(function (url) {
      var i = document.getElementById('plink'); if (!i) return;
      i.value = url; document.getElementById('plink-open').href = url;
      if (url.length > 2000) document.getElementById('plink-note').textContent = 'تنبيه: الرابط طويل (' + url.length + ' حرفًا) وقد يصعب تحويله إلى QR قابل للمسح. قلّل النصوص الطويلة في الملاحظات.';
    });
  }
  function copyLink() {
    var i = document.getElementById('plink'); if (!i.value) { toast('الرابط لم يجهز بعد.', 'error'); return; } i.select(); var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
    if (!ok && navigator.clipboard) { navigator.clipboard.writeText(i.value).then(function () { toast('تم نسخ الرابط.'); }); return; }
    toast(ok ? 'تم نسخ الرابط.' : 'حدد الرابط وانسخه يدويًا.', ok ? '' : 'error');
  }
  function entryHtml(sec, e) {
    var def = Records.SECTIONS[sec];
    var lines = def.fields.filter(function (f) { return f.key !== def.title && f.type !== 'checkbox'; }).map(function (f) {
      var v = f.type === 'date' ? ndate(e[f.key]) : nr(e[f.key]);
      return '<p><span class="lb">' + esc(f.label) + ':</span> ' + v + '</p>';
    }).join('');
    var badges = (e.chronic ? '<span class="badge chronic">مزمنة</span>' : '') + (e.status ? '<span class="badge">' + esc(e.status) + '</span>' : '') + (e.severity ? '<span class="badge' + (e.severity === 'شديدة' ? ' sev' : '') + '">' + esc(e.severity) + '</span>' : '');
    return '<div class="entry"><div class="row between"><h3>' + esc(e[def.title]) + badges + '</h3><span class="row"><button class="btn sm sec" data-act="edit-entry" data-sec="' + sec + '" data-id="' + esc(e.id) + '">تعديل</button><button class="btn sm sec danger" data-act="del-entry" data-sec="' + sec + '" data-id="' + esc(e.id) + '">حذف</button></span></div>' + lines + '</div>';
  }
  function profileView(p) {
    var item = function (l, v) { return '<div><dt>' + l + '</dt><dd>' + v + '</dd></div>'; };
    return '<div class="row between"><div><h1>' + esc(p.fullName) + '</h1><p class="sub">رقم السجل <bdi>' + esc(p.id) + '</bdi> | تاريخ التسجيل ' + ndate(p.registeredAt) + '</p></div>' +
      '<div class="row"><a class="btn sec" href="#/people/' + esc(p.id) + '/edit">تعديل البيانات</a><button class="btn sec danger" data-act="del-person" data-id="' + esc(p.id) + '">حذف السجل</button></div></div>' +
      '<div class="card"><h2 style="margin-bottom:12px">البيانات الشخصية</h2><dl class="info">' + item('الرقم القومي', nr(p.nationalId)) + item('تاريخ الميلاد', ndate(p.dob)) + item('النوع', nr(p.gender)) + item('فصيلة الدم', nr(p.bloodType)) + item('الهاتف', nr(p.phone)) + item('البريد الإلكتروني', nr(p.email)) + item('العنوان', nr(p.address)) +
      item('جهة الاتصال للطوارئ', nr(p.emergencyName)) + item('هاتف الطوارئ', nr(p.emergencyPhone)) + item('ملاحظات صحية عامة', nr(p.notes)) + '</dl></div>' +
      '<div class="card"><h2>رابط السجل الطبي (قراءة فقط)</h2><p class="sub" style="margin:4px 0 10px">يحتوي الرابط على التاريخ المرضي والمعلومات الصحية فقط، بدون الاسم أو أي بيانات شخصية، ويعمل على أي جهاز بدون فتح الموقع. عند تعديل السجل انسخ الرابط من جديد وحدّث رمز QR. أي شخص يملك الرابط يرى هذه المعلومات.</p><div class="row"><input id="plink" readonly placeholder="جارٍ تجهيز الرابط..." style="flex:1;min-width:220px;direction:ltr"><button class="btn sm" data-act="copy-link">نسخ الرابط</button><a class="btn sm sec" id="plink-open" target="_blank" rel="noopener" href="#">فتح الصفحة</a></div><p class="err" id="plink-note"></p></div>' +
      Object.keys(Records.SECTIONS).map(function (sec) {
        var d = Records.SECTIONS[sec], list = p[sec];
        return '<section class="card" aria-labelledby="h-' + sec + '"><div class="row between"><h2 id="h-' + sec + '">' + d.label + '</h2><button class="btn sm" data-act="add-entry" data-sec="' + sec + '">إضافة</button></div>' +
          (list.length ? list.map(function (e) { return entryHtml(sec, e); }).join('') : '<p class="nr">غير مسجل. القسم الفارغ لا يعني عدم وجود شيء يستحق الذكر.</p>') + '</section>';
      }).join('');
  }
  function settingsView() {
    return '<h1>الإعدادات</h1><p class="sub">التفضيلات وإدارة البيانات.</p><div class="card"><h2>تخزين البيانات</h2><p>تُحفظ كل البيانات محليًا في هذا المتصفح باستخدام LocalStorage. هي غير مشفّرة وغير آمنة وغير متزامنة مع أي جهاز آخر. هذا نموذج تجريبي ببيانات وهمية فقط، فلا تدخل أي بيانات شخصية أو طبية أو أرقام قومية حقيقية.</p></div>' +
      '<div class="card"><h2>العرض</h2><div class="field check" style="margin-top:10px"><input type="checkbox" id="compact"' + (Store.data.settings.compact ? ' checked' : '') + '><label for="compact">حجم خط مضغوط</label></div></div>' +
      '<div class="card"><h2>استعادة البيانات التجريبية</h2><p>تستبدل كل السجلات الحالية بالبيانات الوهمية الأصلية.</p><button class="btn danger" data-act="reset">استعادة البيانات التجريبية</button></div>';
  }
  function notFound() { return '<div class="empty"><h1>السجل غير موجود</h1><p>رقم السجل هذا غير موجود أو تم حذفه.</p><a class="btn" href="#/people">العودة إلى السجل</a></div>'; }

  /* ---------- router ---------- */
  function route() {
    var prof = null, parts = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/'), nav = parts[0] === 'people' && parts[1] === 'new' ? 'new' : parts[0], html;
    if (parts[0] === 'dashboard') html = dashboardView();
    else if (parts[0] === 'settings') html = settingsView();
    else if (parts[0] === 'people' && !parts[1]) html = registryView();
    else if (parts[0] === 'people' && parts[1] === 'new') html = personForm(null, { id: People.nextId() }, {});
    else if (parts[0] === 'people') { var p = People.get(decodeURIComponent(parts[1])); html = !p ? notFound() : parts[2] === 'edit' ? personForm(p.id, p, {}) : (prof = p, profileView(p)); }
    else { location.hash = '#/dashboard'; return; }
    main.innerHTML = html; window.scrollTo(0, 0);
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) { a.classList.toggle('active', a.dataset.nav === nav); a.toggleAttribute('aria-current', a.dataset.nav === nav); });
    if (parts[0] === 'people' && !parts[1]) renderRows();
    if (prof) fillLink(prof);
  }
  function refresh() { var y = window.scrollY; route(); window.scrollTo(0, y); }

  /* ---------- entry modal ---------- */
  function entryForm(pid, sec, eid, v, errs) {
    var d = Records.SECTIONS[sec];
    openModal('<h2>' + (eid ? 'تعديل' : 'إضافة') + ' - ' + d.label + '</h2><form data-form="entry" data-pid="' + esc(pid) + '" data-sec="' + sec + '" data-eid="' + esc(eid || '') + '" novalidate>' + d.fields.map(function (f) { return field(f, v, errs); }).join('') +
      '<div class="row"><button class="btn" type="submit">' + (eid ? 'حفظ التغييرات' : 'إضافة') + '</button><button class="btn sec" type="button" data-act="close">إلغاء</button></div></form>');
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act, id = b.dataset.id, sec = b.dataset.sec, pid = (location.hash.split('/')[2] || '');
    if (act === 'close') modal.close();
    else if (act === 'copy-link') copyLink();
    else if (act === 'del-person') {
      var p = People.get(id);
      confirmBox('حذف هذا السجل؟', 'سيتم حذف ' + p.fullName + ' (' + p.id + ') وكل بياناته الطبية نهائيًا.', 'حذف السجل').then(function (ok) {
        if (!ok) return; People.remove(id); toast('تم حذف السجل.'); if (/^#\/people\/REG/.test(location.hash)) location.hash = '#/people'; else refresh();
      });
    } else if (act === 'add-entry') entryForm(pid, sec, null, {}, {});
    else if (act === 'edit-entry') entryForm(pid, sec, id, Records.entries(pid, sec).find(function (e) { return e.id === id; }), {});
    else if (act === 'del-entry') confirmBox('حذف هذا الإدخال؟', 'سيتم حذف هذا الإدخال فقط من السجل.', 'حذف الإدخال').then(function (ok) { if (ok) { Records.remove(pid, sec, id); toast('تم حذف الإدخال.'); refresh(); } });
    else if (act === 'reset') confirmBox('استعادة البيانات التجريبية؟', 'سيتم استبدال كل السجلات الحالية بالبيانات الوهمية الأصلية.', 'استعادة البيانات').then(function (ok) { if (ok) { Store.reset(); toast('تمت استعادة البيانات التجريبية.'); location.hash = '#/dashboard'; refresh(); } });
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f.dataset.form) return; ev.preventDefault();
    var v = formValues(f), errs;
    if (f.dataset.form === 'person') {
      var id = f.dataset.id; v.id = id ? id : (v.id || '').trim();
      v.nationalId = Validation.normDigits(v.nationalId);
      errs = Validation.validatePerson(v, People.all(), id || null);
      if (Object.keys(errs).length) { main.innerHTML = personForm(id || null, v, errs); var first = main.querySelector('[aria-invalid]'); if (first) first.focus(); toast('صحّح الحقول المحددة.', 'error'); return; }
      if (id) { People.update(id, v); toast('تم حفظ التغييرات.'); location.hash = '#/people/' + id; }
      else { People.create(v); toast('تم تسجيل الشخص.'); location.hash = '#/people/' + v.id; }
    } else {
      var def = Records.SECTIONS[f.dataset.sec], vals = Records.readValues(def, v); errs = Validation.validateEntry(def, vals);
      if (Object.keys(errs).length) { entryForm(f.dataset.pid, f.dataset.sec, f.dataset.eid, vals, errs); toast('صحّح الحقول المحددة.', 'error'); return; }
      Records.upsert(f.dataset.pid, f.dataset.sec, f.dataset.eid || null, vals); modal.close(); toast(f.dataset.eid ? 'تم تحديث الإدخال.' : 'تمت إضافة الإدخال.'); refresh();
    }
  });
  document.addEventListener('input', function (ev) { if (ev.target.id === 'q') { ui.q = ev.target.value; renderRows(); } });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.id === 'g') { ui.gender = t.value; renderRows(); }
    else if (t.id === 's') { ui.sort = t.value; renderRows(); }
    else if (t.id === 'compact') { Store.data.settings.compact = t.checked; Store.save(Store.data); document.body.classList.toggle('compact', t.checked); }
  });
  window.addEventListener('hashchange', route);
  document.body.classList.toggle('compact', !!Store.data.settings.compact);
  route();
})();
