/* validation.js - pure validation helpers; return {field: message}. */
(function (w) {
  var today = function () { return new Date().toISOString().slice(0, 10); };
  function normDigits(s) { // converts Arabic-Indic digits to 0-9 and strips spaces
    return String(s || '').replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; }).replace(/\s/g, '');
  }
  function validatePerson(v, people, editingId) {
    var e = {};
    if (!v.fullName.trim()) e.fullName = 'أدخل الاسم الكامل.';
    if (!/^\d{14}$/.test(v.nationalId)) e.nationalId = 'الرقم القومي يجب أن يتكون من 14 رقمًا.';
    else if (people.some(function (p) { return p.id !== editingId && p.nationalId === v.nationalId; })) e.nationalId = 'هذا الرقم القومي مسجل لشخص آخر.';
    if (!v.dob) e.dob = 'أدخل تاريخ الميلاد.'; else if (v.dob > today()) e.dob = 'تاريخ الميلاد لا يمكن أن يكون في المستقبل.';
    if (!v.gender) e.gender = 'اختر النوع.';
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'أدخل بريدًا إلكترونيًا صحيحًا.';
    ['phone', 'emergencyPhone'].forEach(function (k) { if (v[k] && !/^[+()\d٠-٩\s-]{6,20}$/.test(v[k])) e[k] = 'استخدم من 6 إلى 20 رقمًا، ويمكن استخدام + - ( ).'; });
    if (people.some(function (p) { return p.id !== editingId && p.id === v.id; })) e.id = 'رقم السجل موجود بالفعل.';
    return e;
  }
  function validateEntry(def, v) {
    var e = {};
    if (!String(v[def.title] || '').trim()) e[def.title] = 'أدخل ' + def.titleLabel + '.';
    if (v.start && v.end && v.end < v.start) e.end = 'تاريخ الانتهاء لا يمكن أن يسبق تاريخ البدء.';
    return e;
  }
  w.Validation = { validatePerson: validatePerson, validateEntry: validateEntry, normDigits: normDigits };
})(window);
