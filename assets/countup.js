// Count numbers up from 0 the first time they scroll into view (stats, honors, VEX band).
// 數字進入畫面時從 0 跳到實際值；HTML 本身就是最終數字，沒 JS 或「減少動態」時直接顯示。
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var sel = '.tech-kpis b, .l-stat b, .h-stats b, .h-prog b, .number b, .proof b';
  var items = Array.prototype.slice.call(document.querySelectorAll(sel)).map(function (el) {
    var node = Array.prototype.find.call(el.childNodes, function (n) { return n.nodeType === 3 && /\d/.test(n.nodeValue); });
    if (!node) return null;
    var target = parseInt(node.nodeValue.replace(/[^\d]/g, ''), 10);
    if (!target || target < 4) return null;
    return { el: el, node: node, target: target };
  }).filter(Boolean);
  function run(it) {
    var start = null, dur = 1100 + Math.min(900, it.target);
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      it.node.nodeValue = String(Math.round(it.target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var it = items.find(function (x) { return x.el === e.target; });
      io.unobserve(e.target);
      if (it) run(it);
    });
  }, { threshold: 0.4 });
  items.forEach(function (it) { it.node.nodeValue = '0'; io.observe(it.el); });
})();
