// Floating sticker helper: opens a small panel with LINE, phone numbers and FAQ.
// 右下角貼圖小幫手：點開有 LINE 預約、各教室電話、常見問題；Esc 或點外面關閉。
(function () {
  var root = document.getElementById('buddy');
  if (!root) return;
  var btn = root.querySelector('.buddy-btn');
  var panel = document.getElementById('buddy-panel');
  function open(on) {
    panel.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    root.classList.toggle('is-open', on);
  }
  btn.addEventListener('click', function () { open(panel.hidden); });
  root.querySelector('.buddy-x').addEventListener('click', function () { open(false); btn.focus(); });
  root.querySelectorAll('[data-buddy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.dataset.buddy;
      root.querySelectorAll('[data-sub]').forEach(function (s) { s.hidden = s.dataset.sub !== key || !s.hidden; });
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
  document.addEventListener('click', function (e) { if (!panel.hidden && !root.contains(e.target)) open(false); });
})();

// Close the header dropdowns when clicking elsewhere or opening another one. 頁首下拉選單：點外面或開另一個就收起。
(function () {
  var groups = Array.prototype.slice.call(document.querySelectorAll('.nav details'));
  groups.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) groups.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
  document.addEventListener('click', function (e) {
    groups.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
})();
