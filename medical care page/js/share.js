/* share.js - packs a person's HEALTH data (no identity data) into a self-contained link, and reads it back. */
(function (w) {
  var KEYS = ['conditions', 'allergies', 'medications', 'surgeries', 'family'];
  function toB64u(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function fromB64u(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; var bin = atob(str), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  function pack(p) {
    var S = Records.SECTIONS;
    return { v: 1, b: p.bloodType || '', n: p.notes || '', x: KEYS.map(function (k) { return (p[k] || []).map(function (e) { return S[k].fields.map(function (f) { return f.type === 'checkbox' ? (e[f.key] ? 1 : 0) : (e[f.key] || ''); }); }); }) };
  }
  function unpack(d) {
    if (!d || d.v !== 1 || !Array.isArray(d.x)) throw new Error('bad');
    var S = Records.SECTIONS, out = { bloodType: d.b || '', notes: d.n || '' };
    KEYS.forEach(function (k, i) { out[k] = (d.x[i] || []).map(function (row) { var e = {}; S[k].fields.forEach(function (f, j) { e[f.key] = f.type === 'checkbox' ? row[j] === 1 : String(row[j] || ''); }); return e; }); });
    return out;
  }
  async function run(bytes, Ctor) { var s = new Blob([bytes]).stream().pipeThrough(new Ctor('deflate-raw')); return new Uint8Array(await new Response(s).arrayBuffer()); }
  async function encode(p) {
    var bytes = new TextEncoder().encode(JSON.stringify(pack(p)));
    if (typeof CompressionStream === 'function') { try { return 'z' + toB64u(await run(bytes, CompressionStream)); } catch (e) { /* use plain */ } }
    return 'p' + toB64u(bytes);
  }
  async function decode(str) {
    var mode = str.charAt(0), bytes = fromB64u(str.slice(1));
    if (mode === 'z') { if (typeof DecompressionStream !== 'function') throw new Error('nosupport'); bytes = await run(bytes, DecompressionStream); }
    else if (mode !== 'p') throw new Error('bad');
    return unpack(JSON.parse(new TextDecoder().decode(bytes)));
  }
  async function link(p) { return new URL('patient.html', location.href).href.split('#')[0] + '#d=' + await encode(p); }
  w.Share = { encode: encode, decode: decode, link: link };
})(window);
