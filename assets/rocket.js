// Kids hero: tap the rocket → ignition (shake, smoke, flame) → lift-off out of view → fly back down and land.
// 小小玩家主視覺：點火箭 → 點火（抖動、冒煙、噴火）→ 起飛飛出畫面 → 再飛回來降落。
(function () {
  var r = document.querySelector('.rocket');
  if (!r) return;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;
  var steps = calm
    ? [['is-wiggle', 600]]
    : [['is-ignite', 1100], ['is-launch', 1400], ['is-away', 900], ['is-return', 2300], ['is-land', 900]];
  r.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    r.classList.add('was-flown');
    var i = 0;
    (function next() {
      steps.forEach(function (s) { r.classList.remove(s[0]); });
      if (i === steps.length) { busy = false; return; }
      r.classList.add(steps[i][0]);
      setTimeout(next, steps[i++][1]);
    })();
  });
})();
