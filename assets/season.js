// Lunar New Year outfit: from Jan 20 to Feb 28 the site's stickers switch to the red New Year set.
// Add ?cny=1 to any page to preview it. 過年換裝：每年 1/20～2/28 自動換成新年貼圖；網址加 ?cny=1 可平時預覽。
(function () {
  var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  var on = (m === 1 && day >= 20) || m === 2 || /[?&]cny=1\b/.test(location.search);
  if (!on) return;
  var swap = {
    'find-me.png': 'assets/stickers/cny/v1-01.webp',       // 新年快樂（右下角小幫手）
    'wanle.png': 'assets/stickers/cny/v1-07.webp',         // 一馬當先
    'gaoshou.png': 'assets/stickers/cny/v4-07.webp',       // 馬到成功
    'thumbs.png': 'assets/stickers/cny/v2-04.webp',        // 心想事成
    'come-to-class.png': 'assets/stickers/cny/v4-04.webp', // 好久不見
    'call-me.png': 'assets/stickers/cny/v1-03.webp'        // 平平安安
  };
  document.documentElement.classList.add('is-cny');
  document.querySelectorAll('img[src*="assets/stickers/"]').forEach(function (img) {
    var name = img.getAttribute('src').split('/').pop().split('?')[0];
    if (swap[name]) img.src = swap[name];
  });
})();
