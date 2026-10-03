// Kids hero rocket: tap → ignition (shake, smoke, flame) → lift-off → sky-writes the 玩 logo in smoke →
// dives down and parks in the forest at the bottom of the page (it touches down when you scroll down to it).
// Tap the parked rocket → it flies back up and lands on the launch pad at the top (when you scroll back up).
// 小小玩家主視覺火箭：點火 → 起飛 → 在天空噴煙聚成「玩」logo → 往下飛，停到頁底森林（捲到看得見時降落）；
// 點森林裡的火箭 → 飛回頂端發射台降落。prefers-reduced-motion：不飛、不噴煙，只淡入淡出。
(function () {
  var top = document.querySelector('.rocket');
  var land = document.querySelector('.kids-land');
  if (!top || !land) return;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var LOGO = 'assets/img/books/wan-mark-sky.webp';
  var SHIP = top.querySelector('.story-hero-art').getAttribute('src');
  // 170 points sampled from the logo's alpha mask (x, y in 0–99, colour 0 red / 1 yellow), farthest-point order
  // 從 logo 透明遮罩取樣的 170 個點（最遠點排序：只取前 N 個也分布均勻）
  var PTS = [77,48,1,0,91,0,10,17,0,57,4,1,83,96,1,32,58,0,91,15,1,51,86,0,3,48,0,50,33,1,24,82,0,93,72,1,57,62,1,34,14,0,24,35,0,70,23,1,71,77,1,12,66,0,97,52,1,39,73,0,17,97,0,61,46,1,19,50,0,79,64,1,97,88,1,45,48,1,50,18,1,67,92,1,73,9,1,36,91,0,36,27,0,11,82,0,22,21,0,84,82,1,12,29,0,24,68,0,59,74,0,44,5,1,83,24,1,32,45,0,68,57,1,44,62,1,62,15,1,69,39,1,88,45,1,2,24,0,14,40,0,40,37,1,87,56,1,67,67,1,10,56,0,26,94,0,49,70,0,24,12,0,60,35,1,61,84,0,20,60,0,81,15,1,18,75,0,83,72,1,75,86,1,54,53,1,42,82,0,41,20,0,52,42,1,30,75,0,33,66,0,18,88,0,9,92,0,64,7,1,33,83,0,68,48,1,26,52,0,95,80,1,89,90,1,51,10,1,69,16,1,30,21,0,63,22,1,28,28,0,32,36,0,22,43,0,38,52,0,76,56,1,75,70,1,50,78,0,11,48,0,75,94,1,18,16,0,20,29,0,44,13,1,15,22,0,62,54,1,3,84,0,90,22,1,47,55,1,68,84,1,77,21,1,26,62,0,76,27,1,76,41,1,39,44,1,72,63,1,64,78,0,78,78,1,82,89,1,64,62,1,37,8,1,57,20,1,60,67,1,45,41,1,84,50,1,88,76,1,28,87,0,50,3,1,4,19,0,16,34,0,82,43,1,51,60,1,19,66,0,12,73,0,56,80,0,44,88,0,58,10,1,8,23,0,64,40,1,91,51,1,4,54,0,14,61,0,23,74,0,17,81,0,90,84,1,75,15,1,32,51,0,86,18,1,27,40,0,58,41,1,55,47,1,16,55,0,82,59,1,52,65,1,44,67,1,64,72,0,45,75,0,36,78,0,30,10,0,20,38,0,72,52,1,55,70,0,21,93,0,55,15,1,28,16,0,36,21,0,46,21,0,45,35,1,54,37,1,16,45,0,95,47,1,21,55,0,93,56,1,38,86,0,63,89,1,68,11,1,39,15,1,23,17,0,27,46,0,50,49,1,27,57,0,29,70,0,34,71,0];
  var COLORS = [[232, 56, 47], [255, 206, 38]];
  var STEP = ['is-ignite', 'is-launch', 'is-away', 'is-return', 'is-land', 'is-gone', 'is-fade', 'is-ready'];
  var LABEL_HOME = top.getAttribute('aria-label');
  var LABEL_SHOW = '火箭飛上天了';
  var LABEL_GONE = '火箭降落在森林囉，點我到頁面最下面的森林找它';
  var LABEL_PARK = '點我讓火箭從森林飛回去';
  var LABEL_WAIT = '火箭正在飛回來';
  var state = 'home'; // home | busy | parked | waiting (flying home: lands once the top is in view)

  // ---- one clock for everything, driven by requestAnimationFrame, so it pauses while the tab is hidden
  // 統一時鐘：用 rAF 推進，分頁隱藏時自動暫停（每幀最多前進 50ms，切回來不會跳）
  var clock = 0, last = 0, raf = 0, timers = [], frameFns = [];
  function loop(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now; clock += dt;
    for (var i = 0; i < timers.length; i++) {
      if (timers[i].t <= clock) { var f = timers[i].fn; timers.splice(i--, 1); f(); }
    }
    for (var j = 0; j < frameFns.length; j++) frameFns[j](clock);
    raf = (timers.length || frameFns.length) ? requestAnimationFrame(loop) : 0;
    if (!raf) last = 0;
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
  function after(sec, fn) { timers.push({ t: clock + sec, fn: fn }); kick(); }
  document.addEventListener('visibilitychange', function () {
    document.documentElement.classList.toggle('rk-paused', document.hidden); // CSS pauses the rocket keyframes too
    last = 0;
  });

  function setStep(el, cls) {
    STEP.forEach(function (c) { el.classList.remove(c); });
    if (cls) cls.split(' ').forEach(function (c) { el.classList.add(c); });
  }
  function run(el, steps, done) { // steps: [[classes, seconds], …]
    var i = 0;
    (function next() {
      if (i === steps.length) { if (done) done(); return; }
      setStep(el, steps[i][0]);
      after(steps[i++][1], next);
    })();
  }

  // ---- launch pad at the top (shown while the rocket is away) 火箭不在時，頂端的發射台＋提示
  var pad = document.createElement('span');
  pad.className = 'rocket-pad';
  pad.setAttribute('aria-hidden', 'true');
  pad.innerHTML = '<span class="rocket-pad-note"></span><span class="rocket-pad-base"></span>';
  top.appendChild(pad);
  var note = pad.firstChild;
  var hint = top.querySelector('.rocket-hint');
  function say(label, text) { top.setAttribute('aria-label', label); note.innerHTML = text; }

  // ---- the 玩 logo stays above the launch pad after the show (part of the page, scrolls with it) until the
  // rocket comes home (使用者：飛完之後「玩」固定在發射台上方) 飛完後「玩」留在發射台上方，火箭飛回來才淡出
  var kept = null;
  function keptBox() { // viewport box for the logo inside the rocket spot 頂端火箭位置裡 logo 的框
    var r = top.getBoundingClientRect(), size = Math.min(r.width, r.height) * 0.86;
    return { x: r.left + (r.width - size) / 2, y: r.top + r.height * 0.44 - size / 2, size: size, r: r };
  }
  function keepLogo(fadeIn) {
    dropLogo(true);
    var b = keptBox();
    kept = document.createElement('img');
    kept.className = 'rocket-pad-logo' + (fadeIn ? ' is-new' : '');
    kept.src = LOGO; kept.alt = '';
    kept.style.cssText = 'width:' + (b.size / b.r.width * 100).toFixed(2) + '%;left:' + ((b.x - b.r.left) / b.r.width * 100).toFixed(2) +
      '%;top:' + ((b.y - b.r.top) / b.r.height * 100).toFixed(2) + '%';
    pad.appendChild(kept);
    pad.classList.add('has-logo');
    if (fadeIn) after(0.05, function () { if (kept) kept.classList.remove('is-new'); });
  }
  function dropLogo(now) {
    if (!kept) return;
    var k = kept; kept = null;
    pad.classList.remove('has-logo');
    if (now) { k.remove(); return; }
    k.classList.add('is-new');
    after(0.6, function () { k.remove(); });
  }

  // ---- the parked rocket in the forest 森林裡停著的火箭
  var park = document.createElement('button');
  park.type = 'button';
  park.className = 'rocket rocket--park';
  park.hidden = true;
  park.setAttribute('aria-label', LABEL_PARK);
  park.innerHTML = '<span class="rocket-ship"><img class="rocket-park-art" src="' + SHIP + '" alt="" width="900" height="799">' +
    '<span class="rocket-flame" aria-hidden="true"></span></span>' +
    '<span class="rocket-smoke" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
    '<span class="rocket-hint" aria-hidden="true">點我飛回去！</span>';
  land.appendChild(park);

  // ---- "lands when you look": play the landing once the spot scrolls into view 捲到看得見才降落
  function whenSeen(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); }
    }, { threshold: 0.5 });
    io.observe(el);
  }

  // ---- sky show: the smoke trail gathers into the 玩 logo 天空秀：尾煙聚成「玩」
  var logoImg = null;
  function preloadLogo() { if (!logoImg) { logoImg = new Image(); logoImg.src = LOGO; } }
  function sprite(rgb, size) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    var g = c.getContext('2d'), h = size / 2, s = rgb.join(',');
    var grd = g.createRadialGradient(h, h, 0, h, h, h);
    grd.addColorStop(0, 'rgba(' + s + ',1)'); grd.addColorStop(0.45, 'rgba(' + s + ',.9)');
    grd.addColorStop(0.75, 'rgba(' + s + ',.35)'); grd.addColorStop(1, 'rgba(' + s + ',0)');
    g.fillStyle = grd; g.fillRect(0, 0, size, size);
    return c;
  }
  function mix(a, b, k) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * k); }); }
  function ease(k) { k = k < 0 ? 0 : k > 1 ? 1 : k; return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function cr(p0, p1, p2, p3, t) { // Catmull-Rom
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }
  function pathAt(P, u) { // u in [0, P.length-1]
    var n = P.length - 1, i = Math.min(n - 1, Math.max(0, Math.floor(u))), t = u - i;
    var a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n, i + 2)];
    return [cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t)];
  }

  function skyShow(done) {
    var W = document.documentElement.clientWidth, H = window.innerHeight;
    var S = Math.round(Math.min(W * 0.58, H * 0.42, 300));
    // desktop: write the logo right where the rocket took off (keeps the hero text clear); phone: centre
    // 電腦版：logo 寫在火箭剛剛起飛的位置（不蓋到左邊文字）；手機：置中
    var cx = W / 2, cy = Math.max(H * 0.42, 80 + S / 2);
    if (W >= 861) {
      var rb = top.getBoundingClientRect();
      cx = Math.min(W - S, Math.max(S, rb.left + rb.width / 2));
    }
    var N = W < 600 ? 110 : 170;
    var R = Math.max(56, Math.round(S * 0.3)); // flying rocket width 飛行中火箭大小
    var pr = S * Math.sqrt(0.5 / N / Math.PI) * 2.1; // puff radius 煙團半徑
    var dpr = Math.min(window.devicePixelRatio || 1, W < 600 ? 1.5 : 2);

    var wrap = document.createElement('div');
    wrap.className = 'sky-show'; wrap.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var logo = document.createElement('img');
    logo.className = 'sky-logo'; logo.src = LOGO; logo.alt = '';
    logo.style.cssText = 'width:' + S + 'px;height:' + S + 'px;left:' + (cx - S / 2) + 'px;top:' + (cy - S / 2) + 'px';
    var ship = document.createElement('div');
    ship.className = 'sky-rocket';
    ship.style.width = R + 'px';
    ship.innerHTML = '<span class="sky-flame"></span><img src="' + SHIP + '" alt="">';
    wrap.appendChild(cv); wrap.appendChild(logo); wrap.appendChild(ship);
    document.body.appendChild(wrap);
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    var SP = 48, TINTS = 6, white = [255, 255, 255];
    var sprites = COLORS.map(function (c) {
      var a = []; for (var k = 0; k < TINTS; k++) a.push(sprite(mix(white, c, k / (TINTS - 1) * 0.7), SP)); return a;
    });

    // swoop in from the upper right, loop around the logo puffing smoke, then dive down towards the forest
    // 從右上飛進來，繞著 logo 轉一圈多、一邊噴煙，然後往下俯衝飛向森林
    var P = [[W + R, cy - 1.1 * S], [cx + 0.75 * S, cy - 0.75 * S], [cx, cy - 0.9 * S], [cx - 0.85 * S, cy - 0.35 * S],
      [cx - 0.75 * S, cy + 0.6 * S], [cx, cy + 0.9 * S], [cx + 0.85 * S, cy + 0.3 * S], [cx + 0.65 * S, cy - 0.65 * S],
      [cx - 0.1 * S, cy - 0.8 * S], [cx - 0.8 * S, cy - 0.1 * S], [cx - 0.55 * S, cy + 0.9 * S], [cx - 0.2 * S, H + R * 2]];
    var WRITE_END = 8, WRITE_T = 3.0, EXIT_T = 1.4;
    var T_LOGO = 4.5, T_DISPERSE = 6.3, T_END = 7.4; // T_DISPERSE: the logo starts gliding to the pad 開始滑到發射台

    var targets = [];
    for (var i = 0; i < N; i++) {
      var tx = cx + (PTS[i * 3] / 99 - 0.5) * S, ty = cy + (PTS[i * 3 + 1] / 99 - 0.5) * S;
      targets.push({ x: tx, y: ty, c: PTS[i * 3 + 2], a: Math.atan2(ty - cy, tx - cx), used: false });
    }
    var puffs = [], t0 = clock, spawned = 0;

    function rocketAt(s) {
      var u = s < WRITE_T ? (s / WRITE_T) * WRITE_END
        : WRITE_END + Math.min(1, (s - WRITE_T) / EXIT_T) * (P.length - 1 - WRITE_END);
      return pathAt(P, Math.min(P.length - 1, u));
    }
    function spawn(s, pos, hx, hy) {
      // pick the unused target closest in angle to the rocket, so the trail flows inward into the shape
      // 挑角度最接近火箭目前位置的目標點，煙看起來是從尾跡往內流進字形
      var ang = Math.atan2(pos[1] - cy, pos[0] - cx), best = null, bd = 9;
      for (var k = 0; k < N; k++) {
        if (targets[k].used) continue;
        var d = Math.abs(Math.atan2(Math.sin(targets[k].a - ang), Math.cos(targets[k].a - ang)));
        if (d < bd) { bd = d; best = targets[k]; }
      }
      best.used = true;
      puffs.push({ s: s, x0: pos[0] - hx * R * 0.55, y0: pos[1] - hy * R * 0.55,
        vx: -hx * 50 + (Math.random() - 0.5) * 40, vy: -hy * 50 + (Math.random() - 0.5) * 40,
        t: best, w: Math.random() * 6.28, sz: 0.85 + Math.random() * 0.35 });
    }

    function frame(now) {
      var s = now - t0;
      if (s < WRITE_T + EXIT_T) { // the rocket 火箭
        var pos = rocketAt(s), ahead = rocketAt(s + 0.03);
        var hx = ahead[0] - pos[0], hy = ahead[1] - pos[1], hl = Math.hypot(hx, hy) || 1;
        hx /= hl; hy /= hl;
        var rot = Math.atan2(hy, hx) * 180 / Math.PI + 90;
        ship.style.transform = 'translate3d(' + (pos[0] - R / 2).toFixed(1) + 'px,' + (pos[1] - R * 0.45).toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg)';
        var want = Math.min(N, Math.floor(Math.max(0, s - 0.15) / (WRITE_T - 0.25) * N));
        while (spawned < want) { spawn(s, pos, hx, hy); spawned++; }
      } else if (ship.parentNode) { ship.remove(); }
      if (s >= T_LOGO && !logo.classList.contains('is-on')) logo.classList.add('is-on');
      if (s >= T_DISPERSE && !logo.dataset.settle) { // glide onto the launch pad 滑到發射台上方
        logo.dataset.settle = '1';
        var b = keptBox(), k0 = b.size / S;
        logo.style.transition = 'opacity .6s ease, scale .6s ease, transform 1s cubic-bezier(.5,0,.2,1)';
        logo.style.transformOrigin = '0 0';
        logo.style.transform = 'translate(' + (b.x - (cx - S / 2)).toFixed(1) + 'px,' + (b.y - (cy - S / 2)).toFixed(1) + 'px) scale(' + k0.toFixed(3) + ')';
      }

      // the puffs 煙團
      g.clearRect(0, 0, W, H);
      var halo = Math.min(1, Math.max(0, (s - T_LOGO) / 0.6));      // soften into a white cloud behind the logo 變成 logo 背後的白雲
      var gone = Math.min(1, Math.max(0, (s - T_DISPERSE) / 1.0));  // drift apart and fade 散開淡出
      for (var q = 0; q < puffs.length; q++) {
        var p = puffs[q], a = s - p.s;
        var k = ease((a - 0.2) / 1.3), dr = Math.min(a, 0.45);
        var x = p.x0 + p.vx * dr, y = p.y0 + p.vy * dr;
        x += (p.t.x - x) * k; y += (p.t.y - y) * k;
        var wob = Math.sin(now * 2 + p.w);
        x += wob * 2; y += Math.cos(now * 1.7 + p.w) * 2;
        if (gone > 0) { x += (p.t.x - cx) * gone * 0.3; y += (p.t.y - cy) * gone * 0.3 - gone * 30; }
        var r = pr * p.sz * Math.min(1, 0.35 + a / 0.5) * (1 + halo * 0.35 + gone * 0.6) * (1 + wob * 0.05);
        g.globalAlpha = (1 - halo * 0.45) * (1 - gone);
        g.drawImage(sprites[p.t.c][Math.round(k * (1 - halo) * (TINTS - 1))], x - r, y - r, r * 2, r * 2);
      }
      g.globalAlpha = 1;
      if (s >= T_END) {
        frameFns.splice(frameFns.indexOf(frame), 1);
        keepLogo(false);
        wrap.remove();
        done();
      }
    }
    frameFns.push(frame); kick();
  }

  // calm version: the logo just fades in above the pad 減少動態版：logo 直接在發射台上方淡入
  function calmLogo(done) {
    keepLogo(true);
    after(0.45, done);
  }

  // ---- state changes 狀態切換
  function toParked(animateLanding) {
    setStep(top, 'is-gone is-away');
    say(LABEL_GONE, '火箭降落在森林囉 <b>↓</b>');
    park.hidden = false;
    state = 'parked';
    if (!animateLanding) { setStep(park, 'is-ready'); return; }
    setStep(park, 'is-away');
    park.dataset.busy = '1';
    whenSeen(park, function () {
      run(park, [['is-return', 2.3], ['is-land', 0.9]], function () { setStep(park, 'is-ready'); delete park.dataset.busy; });
    });
  }

  function toHome(animateLanding) {
    function done() {
      setStep(top, '');
      say(LABEL_HOME, '');
      if (hint) { hint.textContent = '再飛一次！'; top.classList.remove('was-flown'); }
      state = 'home';
    }
    if (!animateLanding) { dropLogo(false); done(); return; }
    state = 'waiting';
    setStep(top, 'is-gone is-away');
    say(LABEL_WAIT, '火箭飛回來囉！');
    whenSeen(top, function () { dropLogo(false); run(top, [['is-return', 2.3], ['is-land', 0.9]], done); });
  }

  top.addEventListener('click', function () {
    if (state === 'parked') { // go find it in the forest (only scrolls because the visitor asked) 點了才捲到森林
      park.scrollIntoView({ behavior: mq.matches ? 'auto' : 'smooth', block: 'center' });
      park.focus({ preventScroll: true });
      return;
    }
    if (state !== 'home') return;
    state = 'busy';
    top.classList.add('was-flown');
    preloadLogo();
    if (mq.matches) {
      setStep(top, 'is-fade');
      say(LABEL_SHOW, '');
      calmLogo(function () { toParked(false); });
      return;
    }
    run(top, [['is-ignite', 1.1], ['is-launch', 1.4]], function () { setStep(top, 'is-gone is-away'); say(LABEL_SHOW, ''); });
    after(2.2, function () { skyShow(function () { toParked(true); }); });
  });

  park.addEventListener('click', function () {
    if (state !== 'parked' || park.dataset.busy) return;
    state = 'busy';
    if (mq.matches) {
      setStep(park, 'is-fade');
      after(0.45, function () {
        if (document.activeElement === park) top.focus({ preventScroll: true });
        park.hidden = true; setStep(park, ''); toHome(false);
      });
      return;
    }
    run(park, [['is-ignite', 1.0], ['is-launch', 1.4]], function () {
      if (document.activeElement === park) top.focus({ preventScroll: true }); // keep keyboard focus 鍵盤焦點跟著火箭
      park.hidden = true; setStep(park, '');
      toHome(true);
    });
  });
})();
