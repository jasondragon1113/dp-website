// Free-tools page: type out the intro's code line, reveal tool rows on scroll, and only play the
// screen recordings that are on screen (saves data on phones).
// 免費工具頁：開場的 // 註解逐字打出、工具列捲到才淡入、只播放在畫面內的操作錄影（手機省流量）。
(function () {
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var type = document.querySelector('.ti-type');
  if (type) {
    var text = type.dataset.text, k = 0;
    if (calm) { type.textContent = text; } else {
      setTimeout(function step() {
        type.textContent = text.slice(0, ++k);
        if (k < text.length) setTimeout(step, 38);
      }, 1500);
    }
  }
  var rows = document.querySelectorAll('.tool-row');
  if (!('IntersectionObserver' in window)) {
    rows.forEach(function (r) { r.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target.querySelector('video');
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (v && !calm) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      } else if (v) {
        v.pause();
      }
    });
  }, { threshold: 0.35 });
  rows.forEach(function (r) { io.observe(r); });
})();
