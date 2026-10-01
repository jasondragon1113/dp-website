// Tabs shared by the honors and camps pages (deep-linkable as #vex-v5, #hc …) and "show older seasons".
// 分頁共用（榮譽榜、營隊）：網址加 #frc、#hc 這類可直接開到該分頁；錦旗牆「看更早的賽季」。
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.h-tabs [role="tab"]'));
  var bar = document.querySelector('.h-tabs-bar');

  function select(key, scroll) {
    var found = tabs.some(function (t) { return t.dataset.tab === key; });
    if (!found) key = tabs.length ? tabs[0].dataset.tab : 'all';
    tabs.forEach(function (t) {
      var on = t.dataset.tab === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on) t.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    if (scroll && bar) bar.scrollIntoView({ block: 'start' });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      select(t.dataset.tab, false);
      try { history.replaceState(null, '', t === tabs[0] ? location.pathname : '#' + t.dataset.tab); } catch (e) {}
    });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

  document.querySelectorAll('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      select(a.dataset.go, true);
      try { history.replaceState(null, '', '#' + a.dataset.go); } catch (err) {}
    });
  });

  document.querySelectorAll('[data-more]').forEach(function (b) {
    b.addEventListener('click', function () {
      b.closest('.h-wall').querySelectorAll('.season[hidden]').forEach(function (s) { s.hidden = false; });
      b.parentElement.hidden = true;
    });
  });

  select(location.hash.slice(1), false);
})();
