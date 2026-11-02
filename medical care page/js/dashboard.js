/* dashboard.js - statistics computed from saved data. */
(function (w) {
  function stats() {
    var P = People.all();
    return {
      people: P.length,
      conditions: P.reduce(function (n, p) { return n + p.conditions.length; }, 0),
      chronic: P.filter(function (p) { return p.conditions.some(function (c) { return c.chronic; }); }).length,
      allergies: P.filter(function (p) { return p.allergies.length > 0; }).length,
      recent: P.slice().sort(function (a, b) { return (b.registeredAt || '').localeCompare(a.registeredAt || '') || b.id.localeCompare(a.id); }).slice(0, 5)
    };
  }
  w.Dashboard = { stats: stats };
})(window);
