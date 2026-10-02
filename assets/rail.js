// Auto-scrolling video rows (reveals, team videos): drift slowly sideways in a seamless loop.
// Pause while the visitor hovers, touches, scrolls or tabs into the row; resume a moment later.
// 影片列自動左右滑（無縫循環）；滑鼠移上去、手指碰到、自己捲或用鍵盤時暫停，放開後再繼續。
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SPEED = 0.45; // px per frame 每格移動像素

  Array.prototype.forEach.call(document.querySelectorAll('.auto-rail'), function (rail) {
    var looped = false, paused = 0, visible = false, last = null, pos = 0;

    function setupLoop() {
      if (looped || rail.clientWidth === 0 || rail.scrollWidth <= rail.clientWidth + 8) return false;
      // Duplicate the cards once so the row can wrap around without a jump. 複製一份卡片，捲到一半時接回開頭。
      Array.prototype.slice.call(rail.children).forEach(function (c) {
        var copy = c.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('a, button').forEach(function (el) { el.tabIndex = -1; });
        if (copy.matches('a, button')) copy.tabIndex = -1;
        rail.appendChild(copy);
      });
      rail.classList.add('is-looping');
      looped = true;
      pos = rail.scrollLeft;
      return true;
    }
    function hold(ms) { paused = performance.now() + ms; }
    function tick(t) {
      if (visible && !document.hidden && (looped || setupLoop())) {
        if (t > paused) {
          var dt = last === null ? 16 : Math.min(48, t - last);
          pos += SPEED * dt / 16;
          var half = rail.scrollWidth / 2;
          if (pos >= half) pos -= half;
          rail.scrollLeft = pos;
        } else {
          pos = rail.scrollLeft;
        }
      }
      last = t;
      requestAnimationFrame(tick);
    }
    ['mouseenter', 'focusin', 'pointerdown', 'touchstart', 'wheel'].forEach(function (ev) {
      rail.addEventListener(ev, function () { hold(1e9); }, { passive: true });
    });
    ['mouseleave', 'focusout', 'pointerup', 'touchend'].forEach(function (ev) {
      rail.addEventListener(ev, function () { hold(2500); }, { passive: true });
    });
    rail.addEventListener('scroll', function () {
      if (paused > performance.now()) pos = rail.scrollLeft;
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(rail);
    } else {
      visible = true;
    }
    requestAnimationFrame(tick);
  });
})();
