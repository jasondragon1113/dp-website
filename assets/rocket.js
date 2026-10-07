// Kids hero rocket: tap → ignition (shake, smoke, flame) → lift-off → sky-writes the 玩 logo in smoke → hovers →
// descends with the page scrolling along and touches down in the forest at the bottom of the page.
// Tap the parked rocket → it lifts off, flies back up with the page and lands on the launch pad at the top.
// It is always ONE rocket: the tapped one is handed to a fixed flying layer at exactly its box and handed back to
// the target at exactly that box; its size changes evenly along the whole flight.
// 小小玩家主視覺火箭：點火 → 起飛 → 在天空噴煙聚成「玩」logo → 盤旋 → 頁面跟著往下，降落在頁底森林；
// 點森林裡的火箭 → 起飛、頁面跟著往上，降落回頂端發射台。全程只有一艘火箭（原位交接、大小整段漸變）。
// prefers-reduced-motion：不飛、不噴煙，只淡入淡出。
(function () {
  var top = document.querySelector('.rocket');
  var land = document.querySelector('.kids-land');
  if (!top || !land) return;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  // English pages live in /en/: shared files are one folder up. 英文頁在 /en/，圖檔在上一層。
  var LOGO = (document.documentElement.lang === 'en' ? '../' : '') + 'assets/img/books/wan-mark-sky.webp';
  var SHIP = top.querySelector('.story-hero-art').getAttribute('src');
  // 170 points sampled from the logo's alpha mask (x, y in 0–99, colour 0 red / 1 yellow), farthest-point order
  // 從 logo 透明遮罩取樣的 170 個點（最遠點排序：只取前 N 個也分布均勻）
  var PTS = [77,48,1,0,91,0,10,17,0,57,4,1,83,96,1,32,58,0,91,15,1,51,86,0,3,48,0,50,33,1,24,82,0,93,72,1,57,62,1,34,14,0,24,35,0,70,23,1,71,77,1,12,66,0,97,52,1,39,73,0,17,97,0,61,46,1,19,50,0,79,64,1,97,88,1,45,48,1,50,18,1,67,92,1,73,9,1,36,91,0,36,27,0,11,82,0,22,21,0,84,82,1,12,29,0,24,68,0,59,74,0,44,5,1,83,24,1,32,45,0,68,57,1,44,62,1,62,15,1,69,39,1,88,45,1,2,24,0,14,40,0,40,37,1,87,56,1,67,67,1,10,56,0,26,94,0,49,70,0,24,12,0,60,35,1,61,84,0,20,60,0,81,15,1,18,75,0,83,72,1,75,86,1,54,53,1,42,82,0,41,20,0,52,42,1,30,75,0,33,66,0,18,88,0,9,92,0,64,7,1,33,83,0,68,48,1,26,52,0,95,80,1,89,90,1,51,10,1,69,16,1,30,21,0,63,22,1,28,28,0,32,36,0,22,43,0,38,52,0,76,56,1,75,70,1,50,78,0,11,48,0,75,94,1,18,16,0,20,29,0,44,13,1,15,22,0,62,54,1,3,84,0,90,22,1,47,55,1,68,84,1,77,21,1,26,62,0,76,27,1,76,41,1,39,44,1,72,63,1,64,78,0,78,78,1,82,89,1,64,62,1,37,8,1,57,20,1,60,67,1,45,41,1,84,50,1,88,76,1,28,87,0,50,3,1,4,19,0,16,34,0,82,43,1,51,60,1,19,66,0,12,73,0,56,80,0,44,88,0,58,10,1,8,23,0,64,40,1,91,51,1,4,54,0,14,61,0,23,74,0,17,81,0,90,84,1,75,15,1,32,51,0,86,18,1,27,40,0,58,41,1,55,47,1,16,55,0,82,59,1,52,65,1,44,67,1,64,72,0,45,75,0,36,78,0,30,10,0,20,38,0,72,52,1,55,70,0,21,93,0,55,15,1,28,16,0,36,21,0,46,21,0,45,35,1,54,37,1,16,45,0,95,47,1,21,55,0,93,56,1,38,86,0,63,89,1,68,11,1,39,15,1,23,17,0,27,46,0,50,49,1,27,57,0,29,70,0,34,71,0];
  var COLORS = [[232, 56, 47], [255, 206, 38]];
  var STEP = ['is-ignite', 'is-lift', 'is-return', 'is-land', 'is-gone', 'is-fade', 'is-ready'];
  var LABEL_HOME = top.getAttribute('aria-label');
  // English pages get English labels 英文頁用英文字
  var EN = document.documentElement.lang === 'en';
  var LABEL_SHOW = EN ? 'The rocket is flying!' : '火箭飛上天了';
  var LABEL_GONE = EN ? 'The rocket landed in the forest. Tap to find it at the bottom of the page' : '火箭降落在森林囉，點我到頁面最下面的森林找它';
  var LABEL_PARK = EN ? 'Tap to fly the rocket back from the forest' : '點我讓火箭從森林飛回去';
  var LABEL_WAIT = EN ? 'The rocket is flying back' : '火箭正在飛回來';
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
    '<span class="rocket-hint" aria-hidden="true">' + (EN ? 'Tap to fly back!' : '點我飛回去！') + '</span>';
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

  // ---- the ONE flying rocket (使用者：整段動畫只能有一艘火箭，大小、位置連續). The rocket you tapped is handed over to
  // this layer at exactly its on-screen box, flies the whole trip, and is handed back to the target button at exactly
  // that button's box, so there is never a second rocket, a jump or a sudden resize.
  // 唯一的飛行火箭：點的那艘在原位交給這個圖層（位置、大小完全重合），整趟都是它，降落時再原位交回目標按鈕。
  var ASPECT = 799 / 900, flyer = null;
  function smooth(k) { k = k < 0 ? 0 : k > 1 ? 1 : k; return k * k * (3 - 2 * k); }
  function logLerp(a, b, k) { k = k < 0 ? 0 : k > 1 ? 1 : k; return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * k); }
  function touchDown(d) { d = d < 0 ? 0 : d > 1 ? 1 : d; return 1 - Math.pow(1 - d, 3) * (1 + 3 * d); } // starts still, long gentle finish 起步平順、長長的減速
  function artOf(btn) { return btn.querySelector('.story-hero-art, .rocket-park-art'); }
  function spot(btn) { // centre + width of a rocket button's picture on screen 按鈕裡火箭圖的畫面中心與寬度
    var a = artOf(btn), r = a.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: a.offsetWidth || r.width };
  }
  function flyerDraw() {
    var f = flyer, h = f.w * ASPECT;
    f.el.style.width = f.w.toFixed(2) + 'px';
    f.el.style.transform = 'translate3d(' + (f.x - f.w / 2).toFixed(1) + 'px,' + (f.y - h / 2).toFixed(1) + 'px,0) rotate(' + f.rot.toFixed(2) + 'deg)';
    f.flame.style.height = (f.fl * 100).toFixed(1) + '%';
    // side jets follow how fast the nose turns: turning right (clockwise) puffs on the left, and the other way round
    // 側邊噴氣跟著機頭轉動速度：往右轉從左邊噴，往左轉從右邊噴
    var dt = clock - f.tPrev;
    var d = ((f.rot - f.rPrev) % 360 + 540) % 360 - 180;                // a whole-turn jump (-360 → 0) is not a turn 整圈跳角不算轉向
    if (dt > 0) { f.om += (d / dt - f.om) * Math.min(1, dt * 12); f.tPrev = clock; f.rPrev = f.rot; }
    var k = Math.max(0, Math.min(1, (Math.abs(f.om) - 40) / 160));
    jet(f.jl, f.om > 0 ? k : 0); jet(f.jr, f.om < 0 ? k : 0);
  }
  function jet(el, k) {
    el.style.opacity = k ? (0.55 + 0.45 * k).toFixed(2) : '0';
    el.style.scale = k ? ((0.45 + 0.55 * k) * (0.88 + Math.random() * 0.24)).toFixed(2) + ' 1' : '0 1';
  }
  // take the rocket out of a button: same frame, same box 從按鈕接手：同一幀、同一個框
  function flyerFrom(btn) {
    var s = spot(btn);
    if (!flyer) {
      var layer = document.createElement('div');
      layer.className = 'sky-show sky-show--fly'; layer.setAttribute('aria-hidden', 'true');
      var el = document.createElement('div');
      el.className = 'sky-rocket';
      el.innerHTML = '<span class="sky-flame"></span><span class="sky-jet sky-jet--l"></span><span class="sky-jet sky-jet--r"></span>' +
        '<img src="' + SHIP + '" alt="">';
      layer.appendChild(el);
      document.body.appendChild(layer);
      flyer = { layer: layer, el: el, flame: el.children[0], jl: el.children[1], jr: el.children[2] };
    }
    flyer.x = s.x; flyer.y = s.y; flyer.w = s.w; flyer.rot = 0; flyer.fl = 0.34;
    flyer.om = 0; flyer.rPrev = 0; flyer.tPrev = clock;
    flyerDraw();
  }
  function flyerDrop() { if (flyer) { flyer.layer.remove(); flyer = null; } }

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
    var pr = S * Math.sqrt(0.5 / N / Math.PI) * 2.1; // puff radius 煙團半徑
    var dpr = Math.min(window.devicePixelRatio || 1, W < 600 ? 1.5 : 2);

    var wrap = document.createElement('div');
    wrap.className = 'sky-show'; wrap.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var logo = document.createElement('img');
    logo.className = 'sky-logo'; logo.src = LOGO; logo.alt = '';
    logo.style.cssText = 'width:' + S + 'px;height:' + S + 'px;left:' + (cx - S / 2) + 'px;top:' + (cy - S / 2) + 'px';
    wrap.appendChild(cv); wrap.appendChild(logo);
    document.body.appendChild(wrap);
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    var SP = 48, TINTS = 6, white = [255, 255, 255];
    var sprites = COLORS.map(function (c) {
      var a = []; for (var k = 0; k < TINTS; k++) a.push(sprite(mix(white, c, k / (TINTS - 1) * 0.7), SP)); return a;
    });

    // the rocket lifts straight off the pad, curls into one loop around the logo puffing smoke, then slows and turns
    // nose-up to hover just above the logo. It shrinks smoothly while it climbs (it is far away up there).
    // 火箭從發射台直直升空 → 繞 logo 一圈噴煙 → 減速、轉正，停在 logo 上方盤旋；爬升時慢慢變小（飛遠了）
    var w0 = flyer.w, x0 = flyer.x, y0 = flyer.y;
    var Rw = Math.round(S * 0.42), Rh = Rw * ASPECT;                       // size while writing 寫字時的大小
    var yT = cy - 0.95 * S;
    var hy = Math.max(Rh * 0.5 + 6, cy - S / 2 - Rh * 0.85);              // hover just above the logo 盤旋在 logo 上方
    var X = S * Math.min(1, (Math.min(cx, W - cx) - Rw * 0.55) / (0.9 * S)); // keep the loop on a narrow screen 窄螢幕：圈圈不出畫面
    var P = [[x0, y0], [x0, y0 - 0.45 * Math.max(0, y0 - yT)], [cx + 0.1 * X, yT],
      [cx - 0.7 * X, cy - 0.65 * S], [cx - 0.9 * X, cy + 0.15 * S], [cx - 0.45 * X, cy + 0.85 * S], [cx + 0.35 * X, cy + 0.85 * S],
      [cx + 0.9 * X, cy + 0.1 * S], [cx + 0.6 * X, cy - 0.7 * S], [cx + 0.12 * X, hy]];
    var TS = 0.5;  // the whole 玩 show runs at 2× speed (使用者：玩出現的動畫整體快 2 倍) 整段寫字秀 2 倍速
    var LOOP_END = 8, T_L = 0.4, WRITE_T = 3.0 * TS, T_F = 1.0 * TS, SHRINK = 2.0;  // T_L: lift-off 起飛; SHRINK kept at 2 s so the size change stays smooth 縮小維持 2 秒才平順
    var vLoop = (LOOP_END - 2) / WRITE_T, mL = vLoop * T_L / 2, mF = vLoop * T_F;
    var T_SET = T_L + WRITE_T + T_F;                                       // settled into the hover 停穩
    var T_LOGO = T_L + 4.5 * TS, T_DISPERSE = T_L + 6.3 * TS, T_END = T_L + 7.4 * TS;    // T_DISPERSE: the logo glides to the pad 開始滑到發射台
    function uAt(s) { // path parameter: accelerate off the pad, steady loop, ease into the hover 參數：加速升空、等速繞圈、減速停
      if (s < T_L) { var a = s / T_L; return 2 * (a * a * (3 - 2 * a) + mL * (a * a * a - a * a)); }
      if (s < T_L + WRITE_T) return 2 + (s - T_L) * vLoop;
      var b = Math.min(1, (s - T_L - WRITE_T) / T_F);
      return LOOP_END + mF * (b * b * b - 2 * b * b + b) + (-2 * b * b * b + 3 * b * b);
    }
    function headingAt(u) { // nose direction along the path, degrees (0 = up) 沿路徑的機頭方向
      var n = P.length - 1, a = pathAt(P, Math.max(0, u - 0.02)), b = pathAt(P, Math.min(n, u + 0.02));
      return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI + 90;
    }
    var rot = 0, upright = null;

    var targets = [];
    for (var i = 0; i < N; i++) {
      var tx = cx + (PTS[i * 3] / 99 - 0.5) * S, ty = cy + (PTS[i * 3 + 1] / 99 - 0.5) * S;
      targets.push({ x: tx, y: ty, c: PTS[i * 3 + 2], a: Math.atan2(ty - cy, tx - cx), used: false });
    }
    var puffs = [], t0 = clock, spawned = 0;

    function spawn(s, pos, hx, hy2) {
      // pick the unused target closest in angle to the rocket, so the trail flows inward into the shape
      // 挑角度最接近火箭目前位置的目標點，煙看起來是從尾跡往內流進字形
      var ang = Math.atan2(pos[1] - cy, pos[0] - cx), best = null, bd = 9;
      for (var k = 0; k < N; k++) {
        if (targets[k].used) continue;
        var d = Math.abs(Math.atan2(Math.sin(targets[k].a - ang), Math.cos(targets[k].a - ang)));
        if (d < bd) { bd = d; best = targets[k]; }
      }
      best.used = true;
      puffs.push({ s: s, x0: pos[0] - hx * flyer.w * 0.55, y0: pos[1] - hy2 * flyer.w * 0.55,
        vx: -hx * 50 + (Math.random() - 0.5) * 40, vy: -hy2 * 50 + (Math.random() - 0.5) * 40,
        t: best, w: Math.random() * 6.28, sz: 0.85 + Math.random() * 0.35 });
    }

    function frame(now) {
      var s = now - t0;
      // the rocket 火箭
      var u = uAt(s), pos = pathAt(P, Math.min(P.length - 1, u));
      var hd = headingAt(u);
      hd += Math.round((rot - hd) / 360) * 360;                           // keep the angle continuous 角度不跳圈
      if (s >= T_L + WRITE_T) {                                           // turn nose-up while slowing down 減速時轉正
        if (upright === null) upright = Math.round(rot / 360) * 360;
        var bl = smooth((s - T_L - WRITE_T) / T_F);
        rot = hd + (upright - hd) * bl;
      } else rot = hd;
      var bob = Math.min(1, Math.max(0, (s - T_SET) / (1.0 * TS)));             // gentle hover bob 盤旋時輕輕上下
      flyer.x = pos[0] + Math.sin((s - T_SET) * 1.3) * 5 * bob;
      flyer.y = pos[1] + Math.sin((s - T_SET) * 2.2) * 4 * bob;
      flyer.w = logLerp(w0, Rw, s / SHRINK);
      flyer.rot = rot;
      flyer.fl = s < 0.25 ? 0.34 + (0.7 - 0.34) * smooth(s / 0.25)
        : s < T_L + WRITE_T ? 0.7 - 0.08 * smooth((s - T_L) / 0.5) : 0.62 - 0.3 * smooth((s - T_L - WRITE_T) / T_F);
      flyerDraw();
      if (s > T_L && s < T_L + WRITE_T) {
        var r1 = (rot - 90) * Math.PI / 180, hx = Math.cos(r1), hy2 = Math.sin(r1);
        var want = Math.min(N, Math.floor(Math.max(0, s - T_L - 0.15 * TS) / (WRITE_T - 0.25 * TS) * N));
        while (spawned < want) { spawn(s, pos, hx, hy2); spawned++; }
      }
      if (s >= T_LOGO && !logo.classList.contains('is-on')) logo.classList.add('is-on');
      if (s >= T_DISPERSE && !logo.dataset.settle) { // glide onto the launch pad 滑到發射台上方
        logo.dataset.settle = '1';
        var b = keptBox(), k0 = b.size / S;
        logo.style.transition = 'opacity .3s ease, scale .3s ease, transform .5s cubic-bezier(.5,0,.2,1)';
        logo.style.transformOrigin = '0 0';
        logo.style.transform = 'translate(' + (b.x - (cx - S / 2)).toFixed(1) + 'px,' + (b.y - (cy - S / 2)).toFixed(1) + 'px) scale(' + k0.toFixed(3) + ')';
      }

      // the puffs 煙團
      g.clearRect(0, 0, W, H);
      var halo = Math.min(1, Math.max(0, (s - T_LOGO) / (0.6 * TS)));      // soften into a white cloud behind the logo 變成 logo 背後的白雲
      var gone = Math.min(1, Math.max(0, (s - T_DISPERSE) / (1.0 * TS)));  // drift apart and fade 散開淡出
      for (var q = 0; q < puffs.length; q++) {
        var p = puffs[q], a = s - p.s;
        var k = ease((a - 0.2 * TS) / (1.3 * TS)), dr = Math.min(a / TS, 0.45);
        var x = p.x0 + p.vx * dr, y = p.y0 + p.vy * dr;
        x += (p.t.x - x) * k; y += (p.t.y - y) * k;
        var wob = Math.sin(now * 2 + p.w);
        x += wob * 2; y += Math.cos(now * 1.7 + p.w) * 2;
        if (gone > 0) { x += (p.t.x - cx) * gone * 0.3; y += (p.t.y - cy) * gone * 0.3 - gone * 30; }
        var r = pr * p.sz * Math.min(1, 0.35 + a / (0.5 * TS)) * (1 + halo * 0.35 + gone * 0.6) * (1 + wob * 0.05);
        g.globalAlpha = (1 - halo * 0.45) * (1 - gone);
        g.drawImage(sprites[p.t.c][Math.round(k * (1 - halo) * (TINTS - 1))], x - r, y - r, r * 2, r * 2);
      }
      g.globalAlpha = 1;
      if (s >= T_END) {
        frameFns.splice(frameFns.indexOf(frame), 1);
        flyer.rot = 0; // upright is a whole number of turns 轉正＝整圈，歸零
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

  // ---- cruise: the page scrolls slowly along with the rocket so the visitor sees the page again on the way
  // (使用者：飛回來時頁面跟著慢慢往上滑、下去時也慢一點). Any wheel / touch / key / click by the visitor stops it
  // and hands the page back. 巡航：頁面跟著火箭慢慢捲動，一路再看一次頁面；使用者一碰滾輪、螢幕、鍵盤就停下交還。
  var cruising = null;
  function stopCruise() { if (cruising) cruising.stop(); }
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, stopCruise, { passive: true });
  });
  function easeIO(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function targetY(el) { // scroll so the element sits a bit below the middle 讓目標停在畫面中間偏下
    var r = el.getBoundingClientRect();
    var y = window.pageYOffset + r.top + r.height / 2 - window.innerHeight * 0.58;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(max, y));
  }
  function scrollTo(y) { window.scrollTo({ top: y, behavior: 'instant' }); }

  // scroll only (no rocket): "go find it in the forest" 只捲動（不帶火箭）：帶你去森林找火箭
  function glideTo(el) {
    stopCruise();
    var y0 = window.pageYOffset, y1 = targetY(el), dist = Math.abs(y1 - y0), t0 = clock;
    if (dist < 2) return;
    var dur = y1 > y0 ? Math.max(4, Math.min(16, dist / 260)) : Math.max(0.7, Math.min(2.5, dist / 2200));
    function frame(now) {
      var k = Math.min(1, (now - t0) / dur);
      scrollTo(y0 + (y1 - y0) * easeIO(k));
      if (k >= 1) end();
    }
    function end() { cruising = null; frameFns.splice(frameFns.indexOf(frame), 1); }
    cruising = { stop: end };
    frameFns.push(frame); kick();
  }

  // fly(el, down, arrive, late): the flying rocket travels to the rocket button el while the page scrolls along, then
  // touches down exactly on el's box. Going down (to the forest) is slow and ends with a long ~2.8 s touchdown
  // (使用者：降到森林要更慢、比較真實); going up is twice as fast as before (使用者：升空要 2 倍快).
  // The size changes evenly over the whole trip, never in the last second (使用者：降落時突然變大很怪).
  // If the visitor takes over: when el is on screen the rocket still lands on it; otherwise it flies off-screen the
  // way it was going and lands later, once the visitor scrolls to el (late()).
  // 帶著火箭飛到 el：頁面一起捲動，最後剛好降在 el 的位置；大小在整趟平均漸變；被打斷時，目標在畫面上就照樣降落，
  // 否則火箭順著方向飛出畫面，等使用者捲到那裡才降落。
  function fly(el, down, arrive, late) {
    stopCruise();
    var W = document.documentElement.clientWidth, H = window.innerHeight;
    var y0 = window.pageYOffset, y1 = targetY(el), dist = Math.abs(y1 - y0);
    var dur = down ? Math.max(4, Math.min(16, dist / 260)) : Math.max(0.7, Math.min(2.5, dist / 2200)); // up 2200 px/s (使用者：上升再更快；原 380→760→2200) 往上
    var DOCK = down ? 2.8 : 0.6, RIDE = H * (down ? 0.42 : 0.4);
    var LIFT = down ? 1.6 : 0.4;                    // time to reach the riding height (going up: the lift-off) 到巡航高度（往上＝起飛）
    var tD = down ? Math.max(LIFT, dur - 0.8) : Math.max(LIFT, dur - 0.3); // touchdown starts while the page still eases in 頁面快停時開始降落
    var sx = flyer.x, sy = flyer.y, w0 = flyer.w, fl0 = flyer.fl;
    var tx = spot(el).x, w1 = spot(el).w, wT0 = 0, wT1 = tD + DOCK, wA = w0;
    var t0 = clock, camera = dist > 2, dock = null, exit = null, finished = false;
    function finish(fn) {
      if (finished) return;
      finished = true;
      if (cruising === me) cruising = null;
      frameFns.splice(frameFns.indexOf(frame), 1);
      fn();
    }
    function frame(now) {
      var t = now - t0;
      if (camera) {
        var k = Math.min(1, t / dur);
        scrollTo(y0 + (y1 - y0) * easeIO(k));
        if (k >= 1) camera = false;
      }
      if (exit) { // fly off-screen the way it was going 順著方向飛出畫面
        var ek = Math.min(1, (now - exit.t) / exit.dur);
        flyer.y = exit.y + (exit.to - exit.y) * ek * ek;
        flyerDraw();
        if (ek >= 1) finish(function () { flyerDrop(); late(); });
        return;
      }
      var sp = spot(el);
      var sway = smooth(t / 1.2) * (1 - smooth((t - tD + 1.0) / 1.0));
      if (!dock && t >= tD) dock = { t: t, y: flyer.y };
      if (!dock) {
        flyer.y = sy + (RIDE - sy) * smooth(t / LIFT) + Math.sin(now * 2.2) * 6 * sway;
      } else {
        flyer.y = dock.y + (sp.y - dock.y) * touchDown((t - dock.t) / DOCK);
      }
      if (dock && dock.x !== undefined) flyer.x = dock.x + (sp.x - dock.x) * touchDown((t - dock.t) / DOCK); // landing early 提早降落
      else flyer.x = sx + (tx - sx) * smooth(t / wT1) + Math.sin(now * 1.3) * 14 * sway;
      flyer.w = logLerp(wA, w1, (t - wT0) / (wT1 - wT0));
      flyer.rot = Math.sin(now * 1.3 + 1.2) * 2.5 * sway;
      var dk = dock ? touchDown((t - dock.t) / DOCK) : 0;
      flyer.fl = down ? 0.45 + (fl0 - 0.45) * (1 - smooth(t / 1.0)) - 0.33 * dk
        : (0.34 + 0.36 * smooth(t / 0.25)) - 0.58 * dk;
      flyerDraw();
      if (dock && t - dock.t >= DOCK) finish(arrive);
    }
    var me = { stop: function () {
      if (finished || exit) return;
      camera = false;
      var sp = spot(el), t = clock - t0;
      if (sp.y > -sp.w * 0.4 && sp.y < H + sp.w * 0.4) { // target on screen: land on it now 目標在畫面上：直接降落
        if (!dock) { dock = { t: t, y: flyer.y, x: flyer.x }; wA = flyer.w; wT0 = t; wT1 = t + DOCK; }
        return;
      }
      var h = flyer.w * ASPECT;
      exit = { t: clock, y: flyer.y, to: down ? H + h : -h * 1.6, dur: down ? 1.2 : 0.6 };
      if (cruising === me) cruising = null;
    } };
    cruising = me;
    frameFns.push(frame); kick();
  }

  // ---- state changes 狀態切換
  function toParked(animateLanding) {
    setStep(top, 'is-gone' + (animateLanding ? ' is-lift' : ''));
    say(LABEL_GONE, EN ? 'Landed in the forest <b>↓</b>' : '火箭降落在森林囉 <b>↓</b>');
    park.hidden = false;
    state = 'parked';
    if (!animateLanding) { setStep(park, 'is-ready'); return; }
    setStep(park, 'is-gone');          // laid out (so the rocket can aim at it) but empty 先佔位（讓火箭對準）但看不到
    park.dataset.busy = '1';
    function ready() { setStep(park, 'is-ready'); delete park.dataset.busy; }
    fly(park, true, function () { setStep(park, 'is-land'); flyerDrop(); after(0.9, ready); }, // same frame: hand back 同一幀交回
      function () { whenSeen(park, function () { run(park, [['is-return', 2.3], ['is-land', 0.9]], ready); }); });
  }

  function toHome(animateLanding) {
    function done() {
      setStep(top, '');
      say(LABEL_HOME, '');
      if (hint) { hint.textContent = EN ? 'Fly again!' : '再飛一次！'; top.classList.remove('was-flown'); }
      state = 'home';
    }
    if (!animateLanding) { dropLogo(false); done(); return; }
    state = 'waiting';
    setStep(top, 'is-gone');
    say(LABEL_WAIT, EN ? 'The rocket is back!' : '火箭飛回來囉！');
    dropLogo(false);
    fly(top, false, function () { setStep(top, 'is-land'); flyerDrop(); after(0.9, done); },
      function () { whenSeen(top, function () { run(top, [['is-return', 2.3], ['is-land', 0.9]], done); }); });
  }

  top.addEventListener('click', function () {
    if (state === 'parked') { // go find it in the forest (only scrolls because the visitor asked) 點了才捲到森林
      if (mq.matches) park.scrollIntoView({ behavior: 'auto', block: 'center' });
      else glideTo(park);
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
    setStep(top, 'is-ignite');
    after(0.7, function () { // shorter ignition (使用者：上升再更快) 點火縮短 // lift-off: this very rocket leaves the pad 起飛：就是這艘離開發射台
      flyerFrom(top);
      setStep(top, 'is-gone is-lift');
      say(LABEL_SHOW, '');
      skyShow(function () { toParked(true); });
    });
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
    setStep(park, 'is-ignite');
    after(0.6, function () {
      flyerFrom(park);
      setStep(park, 'is-gone is-lift');
      if (document.activeElement === park) top.focus({ preventScroll: true }); // keep keyboard focus 鍵盤焦點跟著火箭
      toHome(true);
      after(1.4, function () { if (state !== 'parked') { park.hidden = true; setStep(park, ''); } }); // after the lift-off smoke 起飛煙散了再收
    });
  });
})();
