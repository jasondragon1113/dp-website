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
  // Time chips follow the classroom: each store <option> has data-times="weekday_pm …" (from its opening hours); the
  // others are hidden and unticked. No classroom picked: all of them. 時段跟著教室：沒開的隱藏並取消勾選；沒選教室全部顯示。
  var storeSel = form.elements.store, storeHint = form.querySelector('.book-hint-store');
  function followStore() {
    var opt = storeSel.selectedIndex >= 0 ? storeSel.options[storeSel.selectedIndex] : null;
    var list = opt && opt.value ? opt.getAttribute('data-times') : null;
    var allow = list === null ? null : ' ' + list + ' ', cut = false;
    var boxes = form.querySelectorAll('input[name="times[]"]');
    for (var i = 0; i < boxes.length; i++) {
      var ok = allow === null || allow.indexOf(' ' + boxes[i].value + ' ') >= 0;
      if (!ok) { boxes[i].checked = false; cut = true; }
      boxes[i].disabled = !ok;
      boxes[i].parentNode.hidden = !ok;
    }
    if (storeHint) storeHint.hidden = !cut;
  }
  if (storeSel) { storeSel.addEventListener('change', followStore); followStore(); }
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
