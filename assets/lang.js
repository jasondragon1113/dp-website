// 中／EN switch helpers. Never redirects by itself: a Chinese page opened by a browser set to English shows one small,
// closable note pointing at the English page; clicking the switch or closing the note is remembered (localStorage).
// 中英切換：不會自動跳轉。瀏覽器是英文、第一次打開中文頁時，顯示一個可關閉的小提示；點過切換或關掉提示就不再出現。
(function () {
  var KEY = 'dp-lang-note';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var sw = document.querySelector('a[data-lang-switch]');
  document.querySelectorAll('a[data-lang-switch]').forEach(function (a) {
    a.addEventListener('click', function () { set('picked'); });
  });
  if (!sw || document.documentElement.lang !== 'zh-Hant-TW' || get()) return;
  var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  if (!/^en\b/i.test(String(langs[0] || ''))) return;
  var box = document.createElement('div');
  box.className = 'lang-note';
  box.setAttribute('role', 'note');
  box.setAttribute('lang', 'en');
  var link = document.createElement('a');
  link.href = sw.getAttribute('href');
  link.textContent = 'Read this page in English';
  link.addEventListener('click', function () { set('picked'); });
  var x = document.createElement('button');
  x.type = 'button';
  x.className = 'lang-note-x';
  x.setAttribute('aria-label', 'Close');
  x.textContent = '×';
  x.addEventListener('click', function () { set('closed'); box.remove(); });
  box.appendChild(link);
  box.appendChild(x);
  document.body.appendChild(box);
})();
