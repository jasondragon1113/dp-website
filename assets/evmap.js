// 首頁世界賽場地圖：滑過／點城市的點，顯示那個城市的小卡（城市、國家、去過幾次、比賽清單）。互動跟服務據點地圖（locmap.js）同一套。
// Home world map ({{event-map}}, tools/evmap.py / server/app/evmap.php): hover / focus a dot = show its card, click = keep it
// open, click elsewhere or Esc = close. Phones (≤900px or no hover) only use taps and the card sits right under the maps (CSS).
// Narrow screens (≤760px) get two buttons (World / Taiwan) that show one map at a time; the world map scrolls sideways and
// starts on Asia. The arcs from Taiwan draw once when the map first scrolls into view (not with reduced motion).
// 窄螢幕：世界／台灣兩個按鈕切換，世界圖可左右滑（一開始停在亞洲）。弧線第一次捲進畫面時畫一次（減少動態時不畫）。
(function () {
  var root = document.querySelector('[data-ev-map]');
  if (!root) return;
  var cards = {};
  Array.prototype.forEach.call(root.querySelectorAll('.ev-map-card'), function (c) { cards[c.getAttribute('data-place')] = c; });
  var pins = root.querySelectorAll('.ev-map-pin');
  var arcs = root.querySelectorAll('.ev-map-arc');
  var touchMode = window.matchMedia('(max-width: 900px), (hover: none)');
  var narrow = window.matchMedia('(max-width: 760px)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pinned = null, preview = null, shown = null, lastTrigger = null, hideTimer = 0;

  function pinOf(id) { return root.querySelector('.ev-map-pin[data-place="' + id + '"]'); }

  // Desktop: the card floats beside its dot (right side, or left when there is no room), kept inside the map block.
  // 電腦版：卡片浮在點的右邊（右邊放不下就放左邊），不超出地圖區塊。
  function place(card, id) {
    card.classList.remove('is-left');
    ['--x', '--y', '--arrow'].forEach(function (k) { card.style.removeProperty(k); });
    if (touchMode.matches) return;
    var pin = pinOf(id);
    if (!pin) return;
    var box = root.getBoundingClientRect(), r = pin.getBoundingClientRect();
    var w = card.offsetWidth, h = card.offsetHeight, gap = 16;
    var cy = r.top + r.height / 2 - box.top;
    var left = r.right - box.left + gap;
    if (left + w > box.width) {
      // no room on the right: go left of the dot — for the Taiwan map, left of the whole map so it stays visible
      // 右邊放不下就放左邊；台灣圖整張放在卡片右邊，不被蓋住
      var fig = pin.closest('.ev-map-tw');
      var edge = fig ? fig.getBoundingClientRect().left : r.left;
      left = edge - box.left - gap - w;
      card.classList.add('is-left');
    }
    if (left < 0) { left = 0; card.classList.remove('is-left'); }
    var top = Math.max(0, cy - 46);
    if (h <= box.height) top = Math.min(top, box.height - h);
    card.style.setProperty('--x', left + 'px');
    card.style.setProperty('--y', top + 'px');
    card.style.setProperty('--arrow', Math.max(20, Math.min(cy - top, h - 20)) + 'px');
  }

  function render() {
    var id = preview || pinned;
    if (id === shown) {
      if (id && cards[id]) { cards[id].classList.toggle('is-pinned', id === pinned); place(cards[id], id); }
      return;
    }
    if (shown && cards[shown]) cards[shown].hidden = true;
    Array.prototype.forEach.call(pins, function (el) { el.classList.toggle('is-on', el.getAttribute('data-place') === id); });
    Array.prototype.forEach.call(arcs, function (el) { el.classList.toggle('is-on', el.getAttribute('data-place') === id); });
    shown = id;
    if (!id || !cards[id]) return;
    var card = cards[id];
    card.classList.toggle('is-pinned', id === pinned);
    card.hidden = false;
    var list = card.querySelector('.ev-map-events');
    if (list) list.scrollTop = 0;
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

  Array.prototype.forEach.call(pins, function (el) {
    var id = el.getAttribute('data-place');
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
    card.querySelector('.ev-map-x').addEventListener('click', function () { closeAll(true); });
  });

  // Click anywhere that is not a dot or a card = close. 點空白處關閉。
  document.addEventListener('click', function (e) {
    if (!shown) return;
    if (e.target.closest && e.target.closest('.ev-map-card, .ev-map-pin')) return;
    closeAll(false);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && shown) closeAll(root.contains(document.activeElement));
  });

  // World / Taiwan buttons (narrow screens only, CSS hides them otherwise). 世界／台灣切換（只有窄螢幕看得到）。
  var scroller = root.querySelector('.ev-map-scroll');
  var startedOnAsia = false;
  function toAsia() { // show Asia first: Taiwan at 60% of the visible width 一開始停在亞洲（台灣在畫面 60% 處）
    if (startedOnAsia || !scroller || !narrow.matches || !scroller.clientWidth || scroller.scrollWidth <= scroller.clientWidth) return;
    startedOnAsia = true;
    scroller.scrollLeft = scroller.scrollWidth * (300.67 / 360) - scroller.clientWidth * 0.6;
  }
  var buttons = root.querySelectorAll('.ev-map-tabs button');
  if (buttons.length > 1) {
    root.classList.add('is-tabs');
    root.setAttribute('data-tab', buttons[0].getAttribute('data-tab'));
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        var tab = b.getAttribute('data-tab');
        Array.prototype.forEach.call(buttons, function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        root.setAttribute('data-tab', tab);
        closeAll(false);
        if (tab === 'world') toAsia();
      });
    });
  }
  toAsia();

  // Arcs: draw once when the world map first comes into view. 弧線：第一次看到世界圖時畫一次。
  var world = root.querySelector('.ev-map-world');
  if (world && arcs.length && !still.matches && 'IntersectionObserver' in window) {
    root.classList.add('ev-arcs-wait');
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (en) { return en.isIntersecting; })) return;
      io.disconnect();
      void root.offsetWidth; // commit the hidden state first, so the transition runs 先讓「沒畫」的狀態生效，過渡才會跑
      root.classList.remove('ev-arcs-wait');
    }, { threshold: 0.25 });
    io.observe(world);
  }

  var onMode = function () { closeAll(false); toAsia(); };
  [touchMode, narrow].forEach(function (m) { if (m.addEventListener) m.addEventListener('change', onMode); else if (m.addListener) m.addListener(onMode); });
  window.addEventListener('resize', function () { if (shown && cards[shown]) place(cards[shown], shown); });
})();
