// 預約試聽表單：?store= / ?course= 預先選好（靜態預覽站也能用）、有錯時跳到錯誤說明、送出後鎖住按鈕避免按兩次。
// Booking form helpers: preselect from ?store= / ?course=, focus the error box, stop double submits.
(function () {
  var form = document.getElementById('book-form');
  if (!form) return;
  try {
    var q = new URLSearchParams(location.search);
    ['store', 'course'].forEach(function (k) {
      var v = q.get(k), sel = form.elements[k];
      if (!v || !sel || sel.value) return;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === v) { sel.value = v; break; }
      }
    });
  } catch (e) { /* old browser: no preselect 舊瀏覽器就不預選 */ }
  var errs = document.getElementById('book-errors');
  if (errs) {
    var bad = form.querySelector('[aria-invalid="true"]');
    if (bad) { bad.focus(); } else { errs.setAttribute('tabindex', '-1'); errs.focus(); }
  }
  form.addEventListener('input', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid');
  });
  form.addEventListener('submit', function () {
    var b = form.querySelector('button[type=submit]');
    if (b && !b.disabled) setTimeout(function () { b.disabled = true; b.setAttribute('data-locked', ''); }, 0);
  });
  // Back button (page from the cache): unlock again. 按上一頁回來時解鎖。
  window.addEventListener('pageshow', function () {
    var b = form.querySelector('button[data-locked]');
    if (b) { b.disabled = false; b.removeAttribute('data-locked'); }
  });
})();
