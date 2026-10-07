// 服務據點地圖：滑過／點地圖上的數字或右邊清單，顯示該據點的資訊卡（今天營業時間依台灣時間算）。
// Locations map ({{store-map}}): hover / focus a pin or list item = show its card, click = keep it open, click elsewhere or
// Esc = close. Phones (≤900px or no hover) only use taps, and the card sits right under the map (CSS), never over it.
// "Today" is the weekday in Taiwan (UTC+8, no daylight saving) from Date.now(); each card carries data-week="Mon|…|Sun"
// ("" = closed, "?" = not known) worked out from the opening hours when the page was built.
(function () {
  var root = document.querySelector('[data-loc-map]');
  if (!root) return;
  var zone = root.querySelector('.loc-map-zone');
  var cards = {};
  Array.prototype.forEach.call(root.querySelectorAll('.loc-map-card'), function (c) { cards[c.getAttribute('data-store')] = c; });
  var triggers = root.querySelectorAll('.loc-map-pin, .loc-map-item a');
  var touchMode = window.matchMedia('(max-width: 900px), (hover: none)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pinned = null, preview = null, shown = null, lastTrigger = null, hideTimer = 0;

  function todayIndex() { // 0 = Mon … 6 = Sun in Taiwan 台灣的星期幾
    return (new Date(Date.now() + 8 * 3600 * 1000).getUTCDay() + 6) % 7;
  }

  function fillToday(card) {
    var p = card.querySelector('.loc-map-today');
    if (!p) return;
    var t = (p.getAttribute('data-week') || '').split('|')[todayIndex()];
    if (t === undefined || t === '?') { p.hidden = true; return; }
    var closed = t === '';
    p.querySelector('.loc-map-t-open').hidden = closed;
    p.querySelector('.loc-map-t-closed').hidden = !closed;
    p.querySelector('.loc-map-t-time').textContent = closed ? '' : t;
    p.classList.toggle('is-closed', closed);
    p.hidden = false;
  }

  function pinOf(id) { return root.querySelector('.loc-map-pin[data-store="' + id + '"]'); }

  // Desktop: line the card up with its pin (arrow points at it), kept inside the zone. 電腦版：卡片對齊那個點。
  function place(card, id) {
    card.style.removeProperty('--top');
    card.style.removeProperty('--arrow');
    if (touchMode.matches) return;
    var pin = pinOf(id);
    if (!pin) return;
    var z = zone.getBoundingClientRect(), r = pin.getBoundingClientRect();
    var y = r.top + r.height / 2 - z.top, h = card.offsetHeight;
    var top = Math.max(0, Math.min(y - 46, z.height - h));
    card.style.setProperty('--top', top + 'px');
    card.style.setProperty('--arrow', Math.max(18, Math.min(y - top, h - 18)) + 'px');
  }

  function render() {
    var id = preview || pinned;
    if (id === shown) {
      if (id && cards[id]) { cards[id].classList.toggle('is-pinned', id === pinned); place(cards[id], id); }
      return;
    }
    if (shown && cards[shown]) cards[shown].hidden = true;
    Array.prototype.forEach.call(triggers, function (el) {
      var on = el.getAttribute('data-store') === id;
      el.classList.toggle('is-on', on);
      if (el.tagName === 'A' && el.closest('.loc-map-item')) el.closest('.loc-map-item').classList.toggle('is-on', on);
    });
    shown = id;
    zone.classList.toggle('has-card', !!id);
    if (!id || !cards[id]) return;
    var card = cards[id];
    fillToday(card);
    card.classList.toggle('is-pinned', id === pinned);
    card.hidden = false;
    place(card, id);
  }

  function cancelHide() { clearTimeout(hideTimer); }
  function hideSoon() {
    cancelHide();
    hideTimer = setTimeout(function () { preview = null; render(); }, 160);
  }

  var quiet = false; // focus moved back by closeAll: do not reopen 關閉後把焦點還回去時不要又打開
  function closeAll(focusBack) {
    var back = focusBack && lastTrigger;
    pinned = null; preview = null; cancelHide(); render();
    if (back) { quiet = true; back.focus(); quiet = false; }
  }

  Array.prototype.forEach.call(triggers, function (el) {
    var id = el.getAttribute('data-store');
    el.addEventListener('mouseenter', function () { if (touchMode.matches) return; cancelHide(); preview = id; render(); });
    el.addEventListener('mouseleave', function () { if (!touchMode.matches) hideSoon(); });
    el.addEventListener('focus', function () { if (touchMode.matches || quiet) return; cancelHide(); lastTrigger = el; preview = id; render(); });
    el.addEventListener('blur', function () { if (!touchMode.matches) hideSoon(); });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      lastTrigger = el;
      cancelHide();
      if (touchMode.matches) {
        pinned = pinned === id ? null : id;
        preview = null;
        render();
        if (pinned && cards[id]) cards[id].scrollIntoView({ block: 'nearest', behavior: still.matches ? 'auto' : 'smooth' });
      } else {
        pinned = id; // desktop: a click keeps it open; close = click elsewhere / Esc / × 電腦：點一下固定
        preview = id;
        render();
      }
    });
  });

  Object.keys(cards).forEach(function (id) {
    var card = cards[id];
    card.addEventListener('mouseenter', cancelHide);
    card.addEventListener('mouseleave', function () { if (!touchMode.matches) hideSoon(); });
    card.addEventListener('focusin', function () { cancelHide(); if (!pinned && !touchMode.matches) preview = id; });
    card.addEventListener('focusout', function () { if (!touchMode.matches) hideSoon(); });
    card.querySelector('.loc-map-x').addEventListener('click', function () { closeAll(true); });
  });

  // Click anywhere that is not a pin, list item or card = close. 點空白處關閉。
  document.addEventListener('click', function (e) {
    if (!shown) return;
    if (e.target.closest && e.target.closest('.loc-map-card, .loc-map-pin, .loc-map-item a')) return;
    closeAll(false);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && shown) {
      var inside = root.contains(document.activeElement);
      closeAll(inside);
    }
  });
  var onMode = function () { closeAll(false); };
  if (touchMode.addEventListener) touchMode.addEventListener('change', onMode); else if (touchMode.addListener) touchMode.addListener(onMode);
  window.addEventListener('resize', function () { if (shown && cards[shown]) place(cards[shown], shown); });
})();
