/* medicalRecords.js - section definitions and entry CRUD. Each entry is isolated by its own id. */
(function (w) {
  var REL = ['الأم', 'الأب', 'أخ/أخت', 'الجد/الجدة', 'ابن/ابنة', 'العم/الخال/العمة/الخالة', 'أخرى'];
  var SECTIONS = {
    conditions: { label: 'الحالات المرضية', title: 'name', titleLabel: 'اسم الحالة', fields: [
      { key: 'name', label: 'اسم الحالة', req: true }, { key: 'date', label: 'تاريخ التسجيل أو التشخيص', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['حالية', 'سابقة'] }, { key: 'chronic', label: 'حالة مزمنة', type: 'checkbox' }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }] },
    allergies: { label: 'الحساسية', title: 'name', titleLabel: 'اسم مسبب الحساسية', fields: [
      { key: 'name', label: 'اسم مسبب الحساسية', req: true }, { key: 'reaction', label: 'رد الفعل' },
      { key: 'severity', label: 'الشدة', type: 'select', options: ['خفيفة', 'متوسطة', 'شديدة'] }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }] },
    medications: { label: 'الأدوية', title: 'name', titleLabel: 'اسم الدواء', fields: [
      { key: 'name', label: 'اسم الدواء', req: true }, { key: 'dosage', label: 'الجرعة المسجلة' }, { key: 'frequency', label: 'عدد المرات' },
      { key: 'start', label: 'تاريخ البدء', type: 'date' }, { key: 'end', label: 'تاريخ الانتهاء', type: 'date' }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }] },
    surgeries: { label: 'العمليات الجراحية السابقة', title: 'name', titleLabel: 'اسم العملية', fields: [
      { key: 'name', label: 'اسم العملية', req: true }, { key: 'date', label: 'التاريخ', type: 'date' }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }] },
    family: { label: 'التاريخ المرضي للعائلة', title: 'name', titleLabel: 'الحالة المرضية', fields: [
      { key: 'name', label: 'الحالة المرضية', req: true }, { key: 'relation', label: 'صلة القرابة', type: 'select', options: REL }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }] }
  };
  function entries(pid, sec) { return People.get(pid)[sec]; }
  function readValues(def, raw) {
    var v = {}; def.fields.forEach(function (f) { v[f.key] = f.type === 'checkbox' ? !!raw[f.key] : String(raw[f.key] || '').trim(); }); return v;
  }
  function upsert(pid, sec, eid, v) {
    var list = entries(pid, sec), i = list.findIndex(function (e) { return e.id === eid; });
    if (i >= 0) list[i] = Object.assign({}, list[i], v); else list.push(Object.assign({ id: Store.uid() }, v));
    Store.save(Store.data);
  }
  function remove(pid, sec, eid) { var p = People.get(pid); p[sec] = p[sec].filter(function (e) { return e.id !== eid; }); Store.save(Store.data); }
  w.Records = { SECTIONS: SECTIONS, entries: entries, readValues: readValues, upsert: upsert, remove: remove };
})(window);
