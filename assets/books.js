// Picture-book reader for the kids page: tap a sample page, flip with buttons, arrow keys or a swipe.
// 小小玩家繪本試讀：點頁面打開，按鈕／方向鍵／手機左右滑翻頁。
(function () {
  var dlg = document.querySelector('.book-reader');
  if (!dlg) return;
  var img = dlg.querySelector('.br-img');
  var title = dlg.querySelector('.br-title');
  var count = dlg.querySelector('.br-count');
  var pages = [], i = 0;

  function show() {
    img.src = pages[i];
    img.alt = title.textContent + ' 試讀第 ' + (i + 1) + ' 頁';
    count.textContent = (i + 1) + ' / ' + pages.length;
    dlg.querySelector('.br-prev').disabled = i === 0;
    dlg.querySelector('.br-next').disabled = i === pages.length - 1;
  }
  function go(d) {
    var n = i + d;
    if (n < 0 || n >= pages.length) return;
    i = n;
    show();
    img.classList.remove('turn-next', 'turn-prev');
    void img.offsetWidth; // restart the slide-in 重播翻頁動畫
    img.classList.add(d > 0 ? 'turn-next' : 'turn-prev');
  }

  // Pages and unit chips pop in one by one when a book scrolls into view. 書卷進畫面時，試讀頁與單元逐一跳出。
  document.querySelectorAll('.book').forEach(function (book) {
    book.querySelectorAll('.book-page').forEach(function (p, k) { p.style.setProperty('--d', (k * 0.08) + 's'); });
    book.querySelectorAll('.book-units li').forEach(function (u, k) { u.style.setProperty('--d', (0.2 + k * 0.05) + 's'); });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    document.querySelectorAll('.book').forEach(function (b) { io.observe(b); });
  } else {
    document.querySelectorAll('.book').forEach(function (b) { b.classList.add('in'); });
  }

  document.querySelectorAll('[data-book]').forEach(function (b) {
    b.addEventListener('click', function () {
      var book = document.getElementById('book-' + b.dataset.book);
      pages = JSON.parse(book.dataset.pages);
      title.textContent = '《' + book.dataset.title + '》';
      i = Number(b.dataset.i) || 0;
      show();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
  });
  dlg.querySelector('.br-prev').addEventListener('click', function () { go(-1); });
  dlg.querySelector('.br-next').addEventListener('click', function () { go(1); });
  dlg.querySelector('.br-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  var x0 = null;
  img.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  img.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    x0 = null;
  });
})();
