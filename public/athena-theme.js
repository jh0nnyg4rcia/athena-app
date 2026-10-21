/* Runs before styles and React. Preferences stay on this device. */
(function () {
  var key = 'athena_theme_preference';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function valid(value) { return value === 'light' || value === 'dark' || value === 'system'; }
  var preference = 'dark';
  var sizeKey = 'athena_reading_size';
  function readingSize(value) { return /^[0-4]$/.test(String(value)) ? Number(value) : 0; }
  var size = 0;
  try { size = readingSize(localStorage.getItem(sizeKey)); } catch (_) {}
  function applySize() {
    root.dataset.readingSize = String(size);
    root.style.setProperty('--athena-reading-scale', String(1 + size * .125));
    window.dispatchEvent(new Event('athena-reading-size-applied'));
  }
  window.addEventListener('athena-reading-size-change', function (event) {
    if (typeof event.detail !== 'number' || !Number.isInteger(event.detail) || event.detail < 0 || event.detail > 4) return;
    size = event.detail;
    try { localStorage.setItem(sizeKey, String(size)); } catch (_) {}
    applySize();
  });
  window.addEventListener('storage', function (event) {
    if (event.key === sizeKey || event.key === null) { size = readingSize(event.newValue); applySize(); }
  });
  applySize();
  try { var saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch (_) {}
  function apply() {
    var theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    root.style.backgroundColor = theme === 'light' ? '#F7F3EA' : '#020617';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F7F3EA' : '#020617');
    window.dispatchEvent(new Event('athena-theme-applied'));
  }
  window.addEventListener('athena-theme-change', function (event) {
    if (!valid(event.detail)) return;
    preference = event.detail;
    try { localStorage.setItem(key, preference); } catch (_) {}
    apply();
  });
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) {
      preference = valid(event.newValue) ? event.newValue : 'dark';
      apply();
    }
  });
  media.addEventListener('change', function () { if (preference === 'system') apply(); });
  apply();
})();
