/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/slides-tabu.js
 * Pemilik : [Orang 2]
 * Tujuan  : Slide 4 (TS A: Inspirasi & Pergerakan) dan Slide 5 (TS B: Tabu List & Hasil)
 * ============================================================================
 *
 * Slide 4 (5 step): inspirasi labirin -> solusi awal LPT -> critical move -> cost move -> swap
 * Slide 5 (5 step): tabu list -> langkah dilarang (X merah) -> aspirasi (X hijau)
 *                   -> putar iterasi + kurva fitness -> hasil akhir vs LPT
 *
 * POLA: tabuSearchToy() dijalankan SEKALI (lazy) memakai RNG berseed lokal
 * (TOY.createRng), bukan TOY.rand, supaya animasi tidak bergantung pada urutan
 * navigasi slide. Semua frame disimpan di array, slide hanya memutar frame.
 *
 * Parameter toy (disederhanakan agar animasi jelas)  vs  parameter asli:
 *   tenure   : 4   (asli 15)
 *   iterasi  : 14  (asli max 150, stop jika 40 iterasi tanpa perbaikan)
 *   kandidat : 8 / iterasi, komposisi 50% critical, 25% cost, 25% swap
 *   awal     : LPT (TOY.lptInitial)
 * ============================================================================
 */
(function () {
  'use strict';

  const TOY = window.TOY;
  const P = { tenure: 4, iters: 14, nSize: 8, seed: 19, realTenure: 15, realMaxIter: 150, realStop: 40 };
  const VM_SHORT = ['Compute', 'Standard', 'Light'];
  const TYPE_LABEL = { critical: 'Critical VM move', cost: 'Cost move', swap: 'Swap' };
  const f4 = (x) => x.toFixed(4);
  const vmLabel = (j) => `VM ${j} (${VM_SHORT[j]})`;
  const taskTag = (t) => `<span class="ts-tag" style="background:${TOY.taskColors[t]}">T${t}</span>`;

  /* ======================================================================
     0. CSS (disisipkan sekali; semua kelas berawalan ts-)
     ====================================================================== */
  (function injectStyle() {
    if (document.getElementById('ts-style')) return;
    const st = document.createElement('style');
    st.id = 'ts-style';
    st.textContent = `
      .ts-cap{font-size:19px;color:var(--text-muted);margin:0 0 12px;min-height:28px}
      .ts-cap b{color:var(--color-ts)}
      .ts-body{flex:1;display:flex;gap:22px;min-height:0;align-items:flex-start}
      .ts-board{flex:0 0 700px;background:#0f172a;border:1px solid var(--border-subtle);border-radius:16px;padding:8px}
      .ts-board.sm{flex:0 0 auto;width:560px}
      .ts-board.wide{flex:1}
      .ts-board svg{display:block;width:100%;height:auto}
      .ts-side{flex:1;display:flex;flex-direction:column;gap:12px;min-width:0}
      .ts-card{background:rgba(30,41,59,.6);border:1px solid var(--border-subtle);border-radius:14px;padding:14px 18px}
      .ts-k{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:700;margin-bottom:6px}
      .ts-big{font-family:var(--font-mono);font-size:30px;font-weight:800;color:var(--text-main)}
      .ts-mid{font-size:18px;font-weight:700;color:var(--text-main)}
      .ts-sub{font-size:14px;color:var(--text-muted);margin-top:4px}
      .ts-chips{display:flex;gap:8px;flex-wrap:wrap}
      .ts-chip{padding:6px 12px;border-radius:999px;border:1px solid var(--border-subtle);font-size:13px;font-weight:700;color:var(--text-muted)}
      .ts-chip.on{border-color:var(--color-ts);color:var(--color-ts);background:rgba(245,158,11,.12)}
      .ts-chip.red{border-color:#ef4444;color:#fca5a5;background:rgba(239,68,68,.12)}
      .ts-chip.green{border-color:#10b981;color:#6ee7b7;background:rgba(16,185,129,.12)}
      .ts-delta{font-family:var(--font-mono);font-size:16px;font-weight:800;margin-left:8px}
      .ts-delta.good{color:#34d399}.ts-delta.bad{color:#f87171}
      .ts-hide{opacity:0;transform:translateY(8px)}
      .ts-show{opacity:1;transform:none;transition:opacity .45s,transform .45s}
      .ts-tag{display:inline-block;min-width:30px;text-align:center;padding:2px 8px;border-radius:6px;color:#0f172a;font-weight:800;font-size:13px}
      .ts-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:rgba(15,23,42,.7);border:1px solid var(--border-subtle);font-size:14px;color:var(--text-main);transition:background .3s,border-color .3s}
      .ts-row .grow{flex:1}
      .ts-row.ban{border-color:#ef4444;background:rgba(239,68,68,.18)}
      .ts-row.ok{border-color:#10b981;background:rgba(16,185,129,.18)}
      .ts-dots i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:3px;background:var(--color-ts)}
      .ts-dots i.off{background:rgba(148,163,184,.25)}
      .ts-num{font-family:var(--font-mono);font-weight:800;color:var(--color-ts);min-width:16px;text-align:right}
      .ts-empty{font-size:14px;color:var(--text-dim);padding:6px 2px}
      .ts-metrics{display:flex;gap:10px;margin-top:8px}
      .ts-metrics .m{flex:1;background:rgba(15,23,42,.7);border:1px solid var(--border-subtle);border-radius:10px;padding:8px 10px;text-align:center}
      .ts-metrics .m span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);font-weight:700}
      .ts-metrics .m b{font-family:var(--font-mono);font-size:17px;color:var(--text-main)}
      .ts-lbl{font-size:15px;font-weight:800;margin:0 0 6px 4px}
    `;
    document.head.appendChild(st);
  })();

  /* ======================================================================
     1. HELPER ANIMASI
     ====================================================================== */
  let TOKEN = 0; // naik tiap step baru -> animasi step lama berhenti sendiri

  function tween(ms, fn, alive) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      function frame(now) {
        if (alive && !alive()) return resolve();
        const p = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOut
        fn(e, p);
        if (p < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Kerangka standar tiap step: header ringkas + 1 kalimat caption + area body. */
  function scaffold(ctx, cat, title, caption) {
    ctx.root.innerHTML = `
      <div class="slide-content fade-in">
        <div class="slide-header-box" style="margin-bottom:8px;">
          <div class="slide-category" style="color:var(--color-ts)">${cat}</div>
          <h2 class="slide-heading" style="font-size:30px">${title}</h2>
        </div>
        <div class="ts-cap">${caption}</div>
        <div class="ts-body"></div>
      </div>`;
    const body = ctx.root.querySelector('.ts-body');
    const tok = ++TOKEN;
    return { body, alive: () => tok === TOKEN && body.isConnected };
  }

  /* ======================================================================
     2. LOGIKA TOY: TABU SEARCH (dijalankan sekali, hasil = frames)
     ====================================================================== */
  function tabuSearchToy(opt) {
    const rng = TOY.createRng(opt.seed);
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const n = TOY.tasks.length;
    let cur = TOY.lptInitial();
    let curE = TOY.evaluate(cur);
    let best = cur.slice();
    let bestF = curE.fitness;
    let bestIter = 0;
    const tabuUntil = TOY.tasks.map(() => [0, 0, 0]); // [task][vm] -> dilarang masuk ke vm itu sampai iterasi X
    const placements = (mv) =>
      mv.type === 'swap'
        ? [{ task: mv.task, vm: mv.to }, { task: mv.other, vm: mv.from }]
        : [{ task: mv.task, vm: mv.to }];

    const frames = [{
      iter: 0, assignment: cur.slice(), move: null, tabuList: [], fitness: curE.fitness,
      bestFitness: bestF, aspirasi: false, blocked: null, hits: []
    }];

    for (let it = 1; it <= opt.iters; it++) {
      const bott = curE.bottleneckVm;
      const bt = cur.map((v, i) => (v === bott ? i : -1)).filter((i) => i >= 0);
      const ct = cur.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
      const cands = [];

      for (let k = 0; k < opt.nSize; k++) {
        const r = rng();
        const c = cur.slice();
        let mv;
        if (r < 0.5 && bt.length) { // critical VM move (50%)
          const t = pick(bt);
          let to = Math.floor(rng() * 3);
          if (to === bott) to = (to + 1) % 3;
          c[t] = to;
          mv = { type: 'critical', task: t, from: bott, to };
        } else if (r < 0.75 && ct.length) { // cost move (25%)
          const t = pick(ct);
          const to = 1 + Math.floor(rng() * 2);
          c[t] = to;
          mv = { type: 'cost', task: t, from: 0, to };
        } else { // swap (25%)
          const a = Math.floor(rng() * n);
          const b = Math.floor(rng() * n);
          if (cur[a] === cur[b]) continue;
          c[a] = cur[b]; c[b] = cur[a];
          mv = { type: 'swap', task: a, other: b, from: cur[a], to: cur[b] };
        }
        const f = TOY.evaluate(c).fitness;
        const hits = placements(mv).filter((p) => tabuUntil[p.task][p.vm] >= it);
        cands.push({ c, mv, f, hits, isTabu: hits.length > 0, asp: f < bestF - 1e-9 });
      }

      let chosen = null;
      let blocked = null;
      for (const x of cands) {
        if (x.isTabu && !x.asp) { if (!blocked || x.f < blocked.f) blocked = x; continue; } // ditolak
        if (!chosen || x.f < chosen.f) chosen = x;
      }
      if (!chosen) { // tidak ada kandidat sah: diam di tempat
        const prev = frames[frames.length - 1];
        frames.push({ ...prev, iter: it, move: null, blocked: null, aspirasi: false, hits: [] });
        continue;
      }
      if (blocked && blocked.f >= chosen.f) blocked = null; // hanya yang menarik: tabu padahal lebih baik

      cur = chosen.c;
      curE = TOY.evaluate(cur);
      const mv = chosen.mv;
      tabuUntil[mv.task][mv.from] = it + opt.tenure;           // task dilarang kembali ke VM asal
      if (mv.type === 'swap') tabuUntil[mv.other][mv.to] = it + opt.tenure;
      if (curE.fitness < bestF - 1e-9) { bestF = curE.fitness; best = cur.slice(); bestIter = it; }

      const tabuList = [];
      for (let t = 0; t < n; t++) for (let v = 0; v < 3; v++) {
        if (tabuUntil[t][v] >= it + 1) tabuList.push({ task: t, vm: v, left: tabuUntil[t][v] - it });
      }
      frames.push({
        iter: it, assignment: cur.slice(), move: mv, tabuList, fitness: curE.fitness, bestFitness: bestF,
        aspirasi: chosen.isTabu && chosen.asp, hits: chosen.hits,
        blocked: blocked ? { move: blocked.mv, f: blocked.f, hits: blocked.hits } : null
      });
    }
    return { frames, best, bestF, bestIter };
  }

  let _run = null;
  const getRun = () => (_run || (_run = tabuSearchToy(P)));

  /** Tetangga terbaik dari satu tipe (dipakai untuk demo move di slide 4). */
  function bestMove(a, type) {
    const e = TOY.evaluate(a);
    let best = null;
    const consider = (c, mv) => {
      const f = TOY.evaluate(c).fitness;
      if (!best || f < best.f) best = { ...mv, type, f, assignment: c };
    };
    for (let t = 0; t < a.length; t++) {
      if (type === 'critical' && a[t] === e.bottleneckVm) {
        for (let v = 0; v < 3; v++) if (v !== a[t]) { const c = a.slice(); c[t] = v; consider(c, { task: t, from: a[t], to: v }); }
      } else if (type === 'cost' && a[t] === 0) {
        for (const v of [1, 2]) { const c = a.slice(); c[t] = v; consider(c, { task: t, from: 0, to: v }); }
      } else if (type === 'swap') {
        for (let u = t + 1; u < a.length; u++) if (a[t] !== a[u]) {
          const c = a.slice(); c[t] = a[u]; c[u] = a[t];
          consider(c, { task: t, other: u, from: a[t], to: a[u] });
        }
      }
    }
    return best;
  }

  /** Optimum global toy (brute force 3^8) untuk pembanding hasil TS. */
  let _opt = null;
  function bruteForceBest() {
    if (_opt) return _opt;
    let best = null;
    const a = new Array(TOY.tasks.length).fill(0);
    (function rec(i) {
      if (i === a.length) { const f = TOY.evaluate(a).fitness; if (!best || f < best.f) best = { f, a: a.slice() }; return; }
      for (let v = 0; v < 3; v++) { a[i] = v; rec(i + 1); }
    })(0);
    return (_opt = best);
  }

  /* skala tinggi blok: satu nilai untuk semua frame agar blok tidak meluber */
  function computePps(extra) {
    const run = getRun();
    const all = run.frames.map((f) => f.assignment).concat(extra || []);
    const BASE_AVAIL = 278;
    let pps = 6;
    const need = (p) => Math.max(...all.map((a) => {
      const sum = [0, 0, 0];
      a.forEach((vm, t) => { sum[vm] += Math.max(22, (TOY.tasks[t] / TOY.vms[vm].mips) * p) + 4; });
      return Math.max(...sum);
    }));
    while (pps > 1 && need(pps) > BASE_AVAIL) pps -= 0.1;
    return pps;
  }
  let _pps = null;
  const getPps = () => (_pps || (_pps = computePps()));

  /* ======================================================================
     3. BOARD: 3 lane VM + blok task yang bisa bergerak (animasi rAF)
     ====================================================================== */
  function createBoard(S, host, alive) {
    const W = 700, H = 400, LW = 216, GAP = 12, X0 = 12, TOP = 8, LH = 340, HEAD = 46;
    const BASE = TOP + LH - 8;
    const pps = getPps();
    const n = TOY.tasks.length;
    const svg = S.initContainer(W, H);
    host.appendChild(svg);

    const lanes = [], pills = [];
    for (let j = 0; j < 3; j++) {
      const x = X0 + j * (LW + GAP), vm = TOY.vms[j];
      const lane = S.rect(x, TOP, LW, LH, { fill: 'rgba(30,41,59,0.45)', rx: 12, ry: 12, stroke: vm.hexColor, 'stroke-width': 1.5 });
      svg.appendChild(lane);
      svg.appendChild(S.text(x + LW / 2, TOP + 23, vm.name, { fill: '#f8fafc', 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle' }));
      svg.appendChild(S.text(x + LW / 2, TOP + 39, vm.badge, { fill: '#94a3b8', 'font-size': 11, 'text-anchor': 'middle' }));
      const pill = S.rect(x + 12, TOP + LH + 8, LW - 24, 28, { fill: 'rgba(30,41,59,0.7)', rx: 6, ry: 6, stroke: 'rgba(148,163,184,0.2)' });
      const ptxt = S.text(x + LW / 2, TOP + LH + 27, '', { fill: '#cbd5e1', 'font-size': 13, 'font-weight': 600, 'text-anchor': 'middle' });
      svg.appendChild(pill); svg.appendChild(ptxt);
      lanes.push(lane); pills.push({ rect: pill, text: ptxt });
    }

    const gBlocks = S.group();
    const gOver = S.group();
    svg.appendChild(gBlocks); svg.appendChild(gOver);

    const BW = LW - 24;
    const blocks = [], cur = [];
    for (let t = 0; t < n; t++) {
      const g = S.group();
      const rect = S.rect(0, 0, BW, 22, { fill: TOY.taskColors[t], rx: 6, ry: 6, stroke: 'rgba(0,0,0,0.4)', 'stroke-width': 1 });
      const lab = S.text(10, 15, `T${t}`, { fill: '#0f172a', 'font-size': 12, 'font-weight': 800 });
      const mi = S.text(34, 15, `${TOY.tasks[t] / 1000}k MI`, { fill: '#0f172a', 'font-size': 10, 'font-weight': 600, opacity: 0.75 });
      const tm = S.text(BW - 8, 15, '', { fill: '#0f172a', 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' });
      g.appendChild(rect); g.appendChild(lab); g.appendChild(mi); g.appendChild(tm);
      gBlocks.appendChild(g);
      blocks.push({ g, rect, lab, mi, tm });
      cur.push({ vm: 0, time: 0, x: X0 + 12, y: BASE - 22, h: 22 });
    }

    let assignment = null;

    function layout(a) {
      const cursor = [BASE, BASE, BASE];
      const tgt = [];
      for (let t = 0; t < n; t++) {
        const vm = a[t];
        const time = TOY.tasks[t] / TOY.vms[vm].mips;
        const h = Math.max(22, time * pps);
        cursor[vm] -= h;
        tgt[t] = { vm, time, h, x: X0 + vm * (LW + GAP) + 12, y: cursor[vm] };
        cursor[vm] -= 4;
      }
      return tgt;
    }
    function apply(t, st) {
      const b = blocks[t];
      b.g.setAttribute('transform', `translate(${st.x},${st.y})`);
      b.rect.setAttribute('height', st.h);
      const ty = st.h / 2 + 4;
      b.lab.setAttribute('y', ty); b.mi.setAttribute('y', ty); b.tm.setAttribute('y', ty);
    }
    function refresh(a) {
      const e = TOY.evaluate(a);
      for (let j = 0; j < 3; j++) {
        const isB = j === e.bottleneckVm;
        lanes[j].setAttribute('stroke', isB ? '#ef4444' : TOY.vms[j].hexColor);
        lanes[j].setAttribute('stroke-width', isB ? 2.5 : 1.5);
        pills[j].rect.setAttribute('fill', isB ? 'rgba(239,68,68,0.2)' : 'rgba(30,41,59,0.7)');
        pills[j].rect.setAttribute('stroke', isB ? '#ef4444' : 'rgba(148,163,184,0.2)');
        pills[j].text.setAttribute('fill', isB ? '#fca5a5' : '#cbd5e1');
        pills[j].text.textContent = `Waktu: ${e.vmTimes[j].toFixed(1)}s${isB ? ' (Bottleneck)' : ''}`;
      }
    }

    const board = {
      svg, overlay: gOver, evalNow: () => TOY.evaluate(assignment),
      get assignment() { return assignment; },

      async set(a, ms) {
        const tgt = layout(a);
        const from = cur.map((c) => ({ ...c }));
        const apply2 = (t, e) => apply(t, {
          x: lerp(from[t].x, tgt[t].x, e), y: lerp(from[t].y, tgt[t].y, e), h: lerp(from[t].h, tgt[t].h, e)
        });
        const setTimes = () => tgt.forEach((s, t) => { blocks[t].tm.textContent = `${s.time.toFixed(1)}s`; });
        if (!ms) {
          tgt.forEach((_, t) => apply2(t, 1)); setTimes();
        } else {
          let textDone = false;
          await tween(ms, (e) => {
            tgt.forEach((_, t) => apply2(t, e));
            if (e >= 0.5 && !textDone) { textDone = true; setTimes(); }
          }, alive);
          tgt.forEach((_, t) => apply2(t, 1)); setTimes();
        }
        tgt.forEach((s, t) => { cur[t] = { ...s }; });
        assignment = a.slice();
        refresh(a);
      },

      mark(tasks, color) {
        blocks.forEach((b, t) => {
          const on = tasks.includes(t);
          b.rect.setAttribute('stroke', on ? (color || '#ffffff') : 'rgba(0,0,0,0.4)');
          b.rect.setAttribute('stroke-width', on ? 3 : 1);
          b.rect.setAttribute('filter', on ? 'drop-shadow(0 0 8px #fff)' : 'none');
        });
      },
      unmark() { this.mark([]); },
      clearOverlay() { S.clear(gOver); },

      /** Panah melengkung dari blok task ke lane VM tujuan + badge (X / centang). */
      async arrow(t, toVm, o) {
        o = o || {};
        const color = o.color || '#fbbf24';
        const s = { x: cur[t].x + BW / 2, y: cur[t].y + cur[t].h / 2 };
        let top = BASE;
        for (let k = 0; k < n; k++) if (cur[k].vm === toVm && k !== t) top = Math.min(top, cur[k].y);
        const tx = X0 + toVm * (LW + GAP) + LW / 2;
        const ty = Math.max(TOP + HEAD + 14, top - 22);
        const mx = (s.x + tx) / 2, my = Math.max(TOP + HEAD + 4, Math.min(s.y, ty) - 55);
        const path = S.path(`M ${s.x} ${s.y} Q ${mx} ${my} ${tx} ${ty}`, {
          fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-linecap': 'round',
          'stroke-dasharray': o.dashed ? '9 7' : null, opacity: 0
        });
        gOver.appendChild(path);
        const ang = Math.atan2(ty - my, tx - mx);
        const hx = (d, a2) => tx + Math.cos(ang + a2) * d, hy = (d, a2) => ty + Math.sin(ang + a2) * d;
        const head = S.create('polygon', {
          points: `${tx},${ty} ${hx(-14, 0.45)},${hy(-14, 0.45)} ${hx(-14, -0.45)},${hy(-14, -0.45)}`, fill: color, opacity: 0
        });
        gOver.appendChild(head);
        await tween(o.ms || 450, (e) => { path.setAttribute('opacity', e); head.setAttribute('opacity', e); }, alive);

        const out = { path, head, x: tx, y: ty, color };
        if (o.badge) {
          const bg = S.group();
          const circ = S.circle(mx, my + (ty - my) * 0.0 + 0, 0, {});
          const bx = lerp(s.x, tx, 0.5), by = (s.y + 2 * my + ty) / 4; // titik tengah kurva
          circ.setAttribute('cx', bx); circ.setAttribute('cy', by);
          const sym = S.text(bx, by + 6, '', { fill: '#fff', 'font-size': 18, 'font-weight': 900, 'text-anchor': 'middle', opacity: 0 });
          bg.appendChild(circ); bg.appendChild(sym); gOver.appendChild(bg);
          const paint = (kind) => {
            circ.setAttribute('fill', kind === 'ok' ? '#10b981' : '#ef4444');
            circ.setAttribute('stroke', '#fff'); circ.setAttribute('stroke-width', 2);
            sym.textContent = kind === 'ok' ? '\u2713' : '\u2715';
          };
          paint(o.badge);
          await tween(260, (e) => { circ.setAttribute('r', 15 * e); sym.setAttribute('opacity', e); }, alive);
          out.setBadge = async (kind) => {
            paint(kind);
            await tween(260, (e) => circ.setAttribute('r', 15 + 5 * Math.sin(Math.PI * e)), alive);
            if (kind === 'ok') { path.setAttribute('stroke', '#10b981'); head.setAttribute('fill', '#10b981'); path.removeAttribute('stroke-dasharray'); }
          };
        }
        return out;
      }
    };
    return board;
  }

  /* ======================================================================
     4. KOMPONEN PANEL (HTML)
     ====================================================================== */
  function typeChips(active) {
    const items = [['critical', 'Critical 50%'], ['cost', 'Cost 25%'], ['swap', 'Swap 25%']];
    return `<div class="ts-card"><div class="ts-k">Neighborhood</div><div class="ts-chips">${
      items.map(([k, l]) => `<span class="ts-chip ${k === active ? 'on' : ''}">${l}</span>`).join('')
    }</div></div>`;
  }

  function fitnessCardHTML(a0, a1) {
    const e0 = TOY.evaluate(a0), e1 = TOY.evaluate(a1);
    const d = ((e1.fitness - e0.fitness) / e0.fitness) * 100;
    const good = d < 0;
    return `
      <div class="ts-k">Fitness F(S)</div>
      <div class="ts-big">${f4(e0.fitness)} <span style="color:var(--text-dim)">\u2192</span> ${f4(e1.fitness)}
        <span class="ts-delta ${good ? 'good' : 'bad'}">${d > 0 ? '+' : ''}${d.toFixed(1)}%</span></div>
      <div class="ts-sub">Makespan ${e0.makespan.toFixed(1)}s \u2192 ${e1.makespan.toFixed(1)}s &nbsp;|&nbsp; Biaya ${e0.cost.toFixed(0)} \u2192 ${e1.cost.toFixed(0)} G$</div>`;
  }

  function tabuRowHTML(en, cls) {
    const dots = Array.from({ length: P.tenure }, (_, i) => `<i class="${i < en.left ? '' : 'off'}"></i>`).join('');
    return `<div class="ts-row ${cls || ''}" data-key="${en.task}-${en.vm}">
      ${taskTag(en.task)}<span class="grow">dilarang kembali ke <b>VM ${en.vm}</b></span>
      <span class="ts-dots">${dots}</span><span class="ts-num">${en.left}</span></div>`;
  }
  function tabuPanelHTML() {
    return `<div class="ts-card"><div class="ts-k">Tabu list &nbsp;\u2022&nbsp; tenure toy ${P.tenure} (asli ${P.realTenure})</div>
      <div class="ts-rows" style="display:flex;flex-direction:column;gap:6px;min-height:150px"></div></div>`;
  }
  function fillTabuRows(container, list, cls) {
    container.innerHTML = list.length
      ? list.map((en) => tabuRowHTML(en, cls)).join('')
      : '<div class="ts-empty">(kosong)</div>';
  }

  function movePlacements(mv) {
    return mv.type === 'swap'
      ? [{ task: mv.task, vm: mv.to }, { task: mv.other, vm: mv.from }]
      : [{ task: mv.task, vm: mv.to }];
  }
  function moveText(mv) {
    if (!mv) return 'Solusi awal LPT';
    return mv.type === 'swap'
      ? `Swap T${mv.task} \u21C4 T${mv.other}`
      : `${TYPE_LABEL[mv.type]}: T${mv.task} VM${mv.from}\u2192VM${mv.to}`;
  }

  /* ======================================================================
     5. SLIDE 4 - TABU SEARCH A
     ====================================================================== */
  const CAT4 = (i) => `Tabu Search \u2022 Inspirasi & Pergerakan (${i}/5)`;

  /* ---- step 1: labirin ---- */
  function walk(circle, pts, ms, alive) {
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d); total += d;
    }
    return tween(ms, (_, p) => {
      let dist = p * total, i = 0;
      while (i < seg.length - 1 && dist > seg[i]) { dist -= seg[i]; i++; }
      const k = seg[i] ? dist / seg[i] : 1;
      circle.setAttribute('cx', lerp(pts[i][0], pts[i + 1][0], k));
      circle.setAttribute('cy', lerp(pts[i][1], pts[i + 1][1], k));
    }, alive);
  }

  async function stepMaze(ctx) {
    const { body, alive } = scaffold(ctx, CAT4(1), 'Ingat jalan buntu, jangan diulang', 'Ingat langkah terakhir, jangan diulang.');
    body.innerHTML = '<div class="ts-board wide"></div>';
    const host = body.firstElementChild;
    const S = ctx.svg;
    const svg = S.initContainer(1100, 360);
    host.appendChild(svg);

    const Sx = [70, 270], A = [330, 270], D1 = [330, 80], B = [640, 270], D2 = [640, 80], E = [1010, 270];
    const corridors = [[Sx, A, B, E], [A, D1], [B, D2]];
    const line = (pts, w, col) => svg.appendChild(S.path('M ' + pts.map((p) => p.join(' ')).join(' L '), {
      fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
    corridors.forEach((c) => line(c, 54, '#334155'));
    corridors.forEach((c) => line(c, 44, '#1e293b'));
    svg.appendChild(S.text(Sx[0], 350, 'Mulai', { fill: '#94a3b8', 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle' }));
    svg.appendChild(S.text(E[0], 350, 'Keluar', { fill: '#34d399', 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle' }));
    Sx[0] = 70; Sx[1] = 270;

    const walker = S.circle(Sx[0], Sx[1], 15, { fill: '#f59e0b', stroke: '#fff', 'stroke-width': 3, filter: 'drop-shadow(0 0 8px #f59e0b)' });
    svg.appendChild(walker);

    const mark = async (pt, label) => {
      const g = S.group();
      const c = S.circle(pt[0], pt[1] - 36, 0, { fill: '#ef4444', stroke: '#fff', 'stroke-width': 2 });
      const x = S.text(pt[0], pt[1] - 29, '\u2715', { fill: '#fff', 'font-size': 20, 'font-weight': 900, 'text-anchor': 'middle', opacity: 0 });
      const t = S.text(pt[0] + 30, pt[1] - 32, label, { fill: '#fca5a5', 'font-size': 14, 'font-weight': 700, opacity: 0 });
      g.appendChild(c); g.appendChild(x); g.appendChild(t); svg.appendChild(g);
      await tween(300, (e) => { c.setAttribute('r', 17 * e); x.setAttribute('opacity', e); t.setAttribute('opacity', e); }, alive);
    };
    const barrier = (pt) => { // tanda larangan di mulut lorong buntu
      svg.appendChild(S.line(pt[0] - 26, pt[1], pt[0] + 26, pt[1], { stroke: '#ef4444', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '2 9' }));
    };

    await ctx.sleep(500);
    await walk(walker, [Sx, A, D1], 1500, alive); if (!alive()) return;
    await mark(D1, 'buntu'); await ctx.sleep(300);
    await walk(walker, [D1, A], 900, alive); if (!alive()) return;
    barrier([A[0], A[1] - 60]); await ctx.sleep(300);
    await walk(walker, [A, B, D2], 1500, alive); if (!alive()) return;
    await mark(D2, 'buntu'); await ctx.sleep(300);
    await walk(walker, [D2, B], 900, alive); if (!alive()) return;
    barrier([B[0], B[1] - 60]); await ctx.sleep(300);
    await walk(walker, [B, E], 1300, alive); if (!alive()) return;
    svg.appendChild(S.text(E[0], E[1] - 32, '\u2713', { fill: '#34d399', 'font-size': 34, 'font-weight': 900, 'text-anchor': 'middle' }));

    const note = document.createElement('div');
    note.className = 'ts-sub ts-hide';
    note.style.cssText = 'margin-top:10px;font-size:15px;text-align:center';
    note.innerHTML = 'Tabu Search (Fred Glover, 1986): terinspirasi <b>memori jangka pendek manusia</b>, bukan dari alam.';
    host.appendChild(note);
    requestAnimationFrame(() => note.classList.add('ts-show'));
  }

  /* ---- step 2: solusi awal LPT (TOY.drawAssignment) ---- */
  async function stepLpt(ctx) {
    const lpt = TOY.lptInitial();
    const e = TOY.evaluate(lpt);
    scaffold(ctx, CAT4(2), 'Solusi awal: LPT',
      `Titik awal pencarian. VM bottleneck: <b>${vmLabel(e.bottleneckVm)}</b>, ${e.vmTimes[e.bottleneckVm].toFixed(1)} s.`);
    const body = ctx.root.querySelector('.ts-body');
    body.style.alignItems = 'center';
    body.style.justifyContent = 'center';
    const svgEl = TOY.drawAssignment(ctx, lpt, {
      title: 'Solusi awal LPT', highlightVm: e.bottleneckVm, width: 1080, height: 430
    });
    svgEl.style.maxHeight = '470px';
    body.appendChild(svgEl);
  }

  /* ---- step 3-5: satu move per step, semuanya dari solusi LPT yang sama ---- */
  function moveStep(type, idx, title, caption) {
    return async function (ctx) {
      const { body, alive } = scaffold(ctx, CAT4(idx), title, caption);
      body.innerHTML = '<div class="ts-board"></div><div class="ts-side"></div>';
      const host = body.querySelector('.ts-board');
      const side = body.querySelector('.ts-side');
      const lpt = TOY.lptInitial();
      const mv = bestMove(lpt, type);

      side.innerHTML = typeChips(type) + `
        <div class="ts-card"><div class="ts-k">Langkah</div>
          <div class="ts-mid">${mv.type === 'swap'
            ? `${taskTag(mv.task)} \u21C4 ${taskTag(mv.other)} &nbsp; VM ${mv.from} \u21C4 VM ${mv.to}`
            : `${taskTag(mv.task)} &nbsp; VM ${mv.from} \u2192 VM ${mv.to}`}</div></div>
        <div class="ts-card ts-hide" id="ts-fit"></div>
        <div class="ts-sub ts-hide" id="ts-note"></div>`;

      const board = createBoard(ctx.svg, host, alive);
      await board.set(lpt, 0);
      await ctx.sleep(700); if (!alive()) return;

      const moved = mv.type === 'swap' ? [mv.task, mv.other] : [mv.task];
      board.mark(moved);
      const arrows = [];
      for (const p of movePlacements(mv)) arrows.push(board.arrow(p.task, p.vm, { color: '#fbbf24', ms: 500 }));
      await Promise.all(arrows);
      if (!alive()) return;
      await ctx.sleep(300);
      await board.set(mv.assignment, 800); if (!alive()) return;
      board.clearOverlay();

      const fit = side.querySelector('#ts-fit');
      fit.innerHTML = fitnessCardHTML(lpt, mv.assignment);
      fit.classList.add('ts-show');
      const worse = mv.f > TOY.evaluate(lpt).fitness;
      const note = side.querySelector('#ts-note');
      note.textContent = worse
        ? 'Tetangga terbaik tipe ini lebih buruk, tapi TS tetap boleh melangkah (keluar dari optimum lokal).'
        : 'Lebih baik dari solusi awal.';
      note.classList.add('ts-show');
    };
  }

  Slides.register({
    id: 'slide-4',
    title: 'Tabu Search A: Inspirasi & Pergerakan',
    steps: [
      { label: 'Inspirasi: labirin & memori', enter: stepMaze },
      { label: 'Solusi Awal LPT', enter: stepLpt },
      { label: 'Critical VM Move', enter: moveStep('critical', 3, 'Neighborhood: Critical VM move', 'Pindahkan task dari <b>VM bottleneck</b> ke VM lain.') },
      { label: 'Cost Move', enter: moveStep('cost', 4, 'Neighborhood: Cost move', 'Turunkan task dari VM <b>Compute (mahal)</b> ke VM murah.') },
      { label: 'Swap Move', enter: moveStep('swap', 5, 'Neighborhood: Swap', 'Dua task <b>bertukar VM</b>.') }
    ]
  });

  /* ======================================================================
     6. SLIDE 5 - TABU SEARCH B
     ====================================================================== */
  const CAT5 = (i) => `Tabu Search \u2022 Tabu List & Hasil (${i}/5)`;

  function sideShell(extraHTML) {
    return tabuPanelHTML() + (extraHTML || '');
  }

  /* ---- step 1: tabu list terisi setelah langkah dilakukan ---- */
  async function stepTabuList(ctx) {
    const { body, alive } = scaffold(ctx, CAT5(1), 'Tabu list: memori langkah',
      'Setiap langkah dicatat: <b>task + VM asal</b> dilarang kembali selama tenure.');
    body.innerHTML = '<div class="ts-board"></div><div class="ts-side"></div>';
    const host = body.querySelector('.ts-board'), side = body.querySelector('.ts-side');
    side.innerHTML = sideShell(`<div class="ts-card"><div class="ts-k">Langkah iterasi 1</div><div class="ts-mid" id="ts-mv">\u2014</div></div>`);
    const rows = side.querySelector('.ts-rows');
    fillTabuRows(rows, []);

    const run = getRun(), f0 = run.frames[0], f1 = run.frames[1];
    const board = createBoard(ctx.svg, host, alive);
    await board.set(f0.assignment, 0);
    await ctx.sleep(700); if (!alive()) return;

    const mv = f1.move;
    const moved = mv.type === 'swap' ? [mv.task, mv.other] : [mv.task];
    side.querySelector('#ts-mv').innerHTML = moveText(mv);
    board.mark(moved);
    await ctx.sleep(500);
    await board.set(f1.assignment, 800); if (!alive()) return;
    board.unmark();

    rows.innerHTML = '';
    for (const en of f1.tabuList) {
      const div = document.createElement('div');
      div.innerHTML = tabuRowHTML(en);
      const row = div.firstElementChild;
      row.classList.add('ts-hide');
      rows.appendChild(row);
      await ctx.sleep(120); if (!alive()) return;
      row.classList.add('ts-show');
      await ctx.sleep(350); if (!alive()) return;
    }
  }

  /* ---- step 2: langkah menuju VM asal ditolak ---- */
  async function stepBlocked(ctx) {
    const { body, alive } = scaffold(ctx, CAT5(2), 'Langkah tabu ditolak',
      'Mencoba kembali ke VM asal? <b>Dilarang</b> selama tenure belum habis.');
    body.innerHTML = '<div class="ts-board"></div><div class="ts-side"></div>';
    const host = body.querySelector('.ts-board'), side = body.querySelector('.ts-side');
    const run = getRun();
    const k = run.frames.findIndex((f) => f.blocked && f.blocked.move.type !== 'swap');
    const kk = k > 0 ? k : run.frames.findIndex((f) => f.blocked);
    const prev = run.frames[kk - 1], bl = run.frames[kk].blocked;

    side.innerHTML = sideShell(`<div class="ts-card ts-hide" id="ts-st"></div>`);
    const rows = side.querySelector('.ts-rows');
    fillTabuRows(rows, prev.tabuList);

    const board = createBoard(ctx.svg, host, alive);
    await board.set(prev.assignment, 0);
    await ctx.sleep(800); if (!alive()) return;

    const mv = bl.move;
    board.mark(mv.type === 'swap' ? [mv.task, mv.other] : [mv.task]);
    const hitKeys = bl.hits.map((h) => `${h.task}-${h.vm}`);
    for (const p of movePlacements(mv)) {
      const isHit = hitKeys.includes(`${p.task}-${p.vm}`);
      await board.arrow(p.task, p.vm, { color: isHit ? '#ef4444' : '#fbbf24', dashed: isHit, badge: isHit ? 'x' : null, ms: 600 });
      if (!alive()) return;
    }
    rows.querySelectorAll('.ts-row').forEach((r) => { if (hitKeys.includes(r.dataset.key)) r.classList.add('ban'); });
    const h0 = bl.hits[0];
    const st = side.querySelector('#ts-st');
    st.innerHTML = `<div class="ts-k">Status kandidat</div>
      <div class="ts-mid" style="color:#fca5a5">\u2715 Ditolak: ${taskTag(h0.task)} dilarang masuk VM ${h0.vm}</div>
      <div class="ts-sub">Sisa tenure ${prev.tabuList.find((e) => e.task === h0.task && e.vm === h0.vm).left}. TS memilih kandidat lain.</div>`;
    st.classList.add('ts-show');
  }

  /* ---- step 3: aspirasi, larangan dilanggar karena memecahkan rekor ---- */
  async function stepAspiration(ctx) {
    const { body, alive } = scaffold(ctx, CAT5(3), 'Aspiration criterion',
      'Langkah tabu <b>boleh dilanggar</b> jika memecahkan rekor terbaik.');
    body.innerHTML = '<div class="ts-board"></div><div class="ts-side"></div>';
    const host = body.querySelector('.ts-board'), side = body.querySelector('.ts-side');
    const run = getRun();
    const k = run.frames.findIndex((f) => f.aspirasi);
    const kk = k > 0 ? k : run.frames.length - 1;
    const prev = run.frames[kk - 1], fr = run.frames[kk];

    side.innerHTML = sideShell(`<div class="ts-card ts-hide" id="ts-st"></div>`);
    const rows = side.querySelector('.ts-rows');
    fillTabuRows(rows, prev.tabuList);

    const board = createBoard(ctx.svg, host, alive);
    await board.set(prev.assignment, 0);
    await ctx.sleep(800); if (!alive()) return;

    const mv = fr.move;
    board.mark(mv.type === 'swap' ? [mv.task, mv.other] : [mv.task]);
    const hitKeys = fr.hits.map((h) => `${h.task}-${h.vm}`);
    const arrows = [];
    for (const p of movePlacements(mv)) {
      const isHit = hitKeys.includes(`${p.task}-${p.vm}`);
      arrows.push(await board.arrow(p.task, p.vm, { color: isHit ? '#ef4444' : '#fbbf24', dashed: isHit, badge: isHit ? 'x' : null, ms: 500 }));
      if (!alive()) return;
    }
    rows.querySelectorAll('.ts-row').forEach((r) => { if (hitKeys.includes(r.dataset.key)) r.classList.add('ban'); });

    const st = side.querySelector('#ts-st');
    st.innerHTML = `<div class="ts-k">Cek aspirasi</div>
      <div class="ts-mid">F kandidat <span style="color:#34d399">${f4(fr.fitness)}</span> &lt; rekor <span style="color:#fbbf24">${f4(prev.bestFitness)}</span></div>
      <div class="ts-sub">Tabu, tetapi menghasilkan solusi terbaik baru.</div>`;
    st.classList.add('ts-show');
    await ctx.sleep(1100); if (!alive()) return;

    for (const a of arrows) if (a.setBadge) await a.setBadge('ok');
    rows.querySelectorAll('.ts-row.ban').forEach((r) => { r.classList.remove('ban'); r.classList.add('ok'); });
    await ctx.sleep(400); if (!alive()) return;
    await board.set(fr.assignment, 800); if (!alive()) return;
    board.clearOverlay(); board.unmark();
    st.innerHTML = `<div class="ts-k">Aspirasi diterima</div>
      <div class="ts-mid" style="color:#6ee7b7">\u2605 Rekor baru: F = ${f4(fr.bestFitness)}</div>
      <div class="ts-sub">${moveText(mv)}</div>`;
  }

  /* ---- step 4: putar frame iterasi + kurva fitness ---- */
  function createChart(S, host, frames, alive) {
    const W = 420, H = 250, L = 46, R = 14, T = 14, B = 34;
    const N = frames.length - 1;
    const fs = frames.map((f) => f.fitness);
    const lo = Math.min(0.96, Math.min(...fs) - 0.01), hi = Math.max(...fs) + 0.02;
    const X = (i) => L + ((W - L - R) * i) / N;
    const Y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const svg = S.initContainer(W, H);
    host.appendChild(svg);

    for (let v = Math.ceil(lo * 20) / 20; v <= hi; v += 0.05) {
      svg.appendChild(S.line(L, Y(v), W - R, Y(v), { stroke: 'rgba(148,163,184,0.15)', 'stroke-width': 1 }));
      svg.appendChild(S.text(L - 6, Y(v) + 4, v.toFixed(2), { fill: '#94a3b8', 'font-size': 11, 'text-anchor': 'end' }));
    }
    for (let i = 0; i <= N; i += 2) svg.appendChild(S.text(X(i), H - B + 16, i, { fill: '#94a3b8', 'font-size': 11, 'text-anchor': 'middle' }));
    svg.appendChild(S.text(W - R, H - 6, 'iterasi', { fill: '#64748b', 'font-size': 11, 'text-anchor': 'end' }));
    svg.appendChild(S.line(L, Y(1), W - R, Y(1), { stroke: '#64748b', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
    svg.appendChild(S.text(W - R - 2, Y(1) - 5, 'LPT = 1.00', { fill: '#94a3b8', 'font-size': 11, 'text-anchor': 'end' }));

    const curLine = S.path('', { fill: 'none', stroke: '#94a3b8', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    const bestLine = S.path('', { fill: 'none', stroke: '#f59e0b', 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
    const dot = S.circle(X(0), Y(fs[0]), 5.5, { fill: '#f8fafc' });
    svg.appendChild(curLine); svg.appendChild(bestLine); svg.appendChild(dot);

    return {
      update(i) {
        let d1 = `M ${X(0)} ${Y(fs[0])}`, d2 = `M ${X(0)} ${Y(frames[0].bestFitness)}`;
        for (let k = 1; k <= i; k++) {
          d1 += ` L ${X(k)} ${Y(fs[k])}`;
          d2 += ` L ${X(k)} ${Y(frames[k - 1].bestFitness)} L ${X(k)} ${Y(frames[k].bestFitness)}`;
        }
        curLine.setAttribute('d', d1); bestLine.setAttribute('d', d2);
        dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(fs[i]));
      },
      flag(i, kind) {
        if (kind === 'asp') {
          svg.appendChild(S.text(X(i), Y(fs[i]) - 10, '\u2605', { fill: '#34d399', 'font-size': 20, 'text-anchor': 'middle' }));
        } else {
          svg.appendChild(S.text(X(i), H - B - 6, '\u2715', { fill: '#ef4444', 'font-size': 13, 'font-weight': 900, 'text-anchor': 'middle' }));
        }
      }
    };
  }

  async function stepPlay(ctx) {
    const { body, alive } = scaffold(ctx, CAT5(4), 'Iterasi berjalan, fitness turun',
      'Terus bergerak walau kadang naik; <b>rekor terbaik</b> tetap dijaga.');
    body.innerHTML = '<div class="ts-board"></div><div class="ts-side"></div>';
    const host = body.querySelector('.ts-board'), side = body.querySelector('.ts-side');
    const run = getRun(), frames = run.frames, N = frames.length - 1;

    side.innerHTML = `
      <div class="ts-card"><div class="ts-k">Kurva fitness F(S)</div><div id="ts-chart"></div>
        <div class="ts-chips" style="margin-top:6px">
          <span class="ts-chip" style="color:#cbd5e1">\u2014 saat ini</span>
          <span class="ts-chip on">\u2014 terbaik</span>
          <span class="ts-chip red">\u2715 ditolak</span>
          <span class="ts-chip green">\u2605 aspirasi</span></div></div>
      <div class="ts-card"><div class="ts-k" id="ts-it">Iterasi 0 / ${N}</div>
        <div class="ts-mid" id="ts-mv">Solusi awal LPT</div>
        <div class="ts-sub" id="ts-ft">F = ${f4(frames[0].fitness)} &nbsp;|&nbsp; terbaik ${f4(frames[0].bestFitness)}</div></div>`;

    const board = createBoard(ctx.svg, host, alive);
    const chart = createChart(ctx.svg, side.querySelector('#ts-chart'), frames, alive);
    await board.set(frames[0].assignment, 0);
    chart.update(0);
    await ctx.sleep(700); if (!alive()) return;

    for (let i = 1; i <= N; i++) {
      const f = frames[i];
      side.querySelector('#ts-it').textContent = `Iterasi ${i} / ${N}`;
      side.querySelector('#ts-mv').innerHTML = moveText(f.move);
      side.querySelector('#ts-ft').innerHTML = `F = ${f4(f.fitness)} &nbsp;|&nbsp; terbaik ${f4(f.bestFitness)}`;
      if (f.blocked) chart.flag(i, 'block');
      await board.set(f.assignment, 450); if (!alive()) return;
      chart.update(i);
      if (f.aspirasi) chart.flag(i, 'asp');
      await ctx.sleep(380); if (!alive()) return;
    }
    const nb = frames.filter((f) => f.blocked).length;
    side.querySelector('#ts-mv').innerHTML = `Selesai: terbaik di iterasi ${run.bestIter}`;
    side.querySelector('#ts-ft').innerHTML = `${nb} iterasi menolak langkah tabu \u2022 F terbaik ${f4(run.bestF)}`;
  }

  /* ---- step 5: hasil akhir vs LPT + kondisi berhenti ---- */
  async function stepResult(ctx) {
    const { body, alive } = scaffold(ctx, CAT5(5), 'Hasil akhir vs LPT',
      'TS menemukan solusi lebih baik dari titik awalnya.');
    const run = getRun();
    const lpt = TOY.lptInitial();
    const e0 = TOY.evaluate(lpt), e1 = TOY.evaluate(run.best);
    const pct = (a, b) => { const d = ((b - a) / a) * 100; return `<span class="ts-delta ${d < 0 ? 'good' : 'bad'}">${d > 0 ? '+' : ''}${d.toFixed(1)}%</span>`; };
    const opt = bruteForceBest();
    const isOpt = Math.abs(opt.f - run.bestF) < 1e-9;

    body.style.flexDirection = 'column';
    body.style.alignItems = 'stretch';
    body.innerHTML = `
      <div style="display:flex;gap:24px;justify-content:center">
        <div><div class="ts-lbl" style="color:#94a3b8">LPT (awal)</div><div class="ts-board sm" id="ts-b0"></div>
          <div class="ts-metrics"><div class="m"><span>Makespan</span><b>${e0.makespan.toFixed(1)}s</b></div>
            <div class="m"><span>Biaya</span><b>${e0.cost.toFixed(0)}</b></div><div class="m"><span>F(S)</span><b>${f4(e0.fitness)}</b></div></div></div>
        <div><div class="ts-lbl" style="color:var(--color-ts)">Tabu Search (akhir)</div><div class="ts-board sm" id="ts-b1"></div>
          <div class="ts-metrics"><div class="m"><span>Makespan</span><b>${e1.makespan.toFixed(1)}s</b>${pct(e0.makespan, e1.makespan)}</div>
            <div class="m"><span>Biaya</span><b>${e1.cost.toFixed(0)}</b>${pct(e0.cost, e1.cost)}</div>
            <div class="m"><span>F(S)</span><b>${f4(e1.fitness)}</b>${pct(e0.fitness, e1.fitness)}</div></div></div>
      </div>
      <div class="ts-chips" style="justify-content:center;margin-top:14px">
        <span class="ts-chip on">Berhenti: ${P.realMaxIter} iterasi ATAU ${P.realStop} iterasi tanpa perbaikan</span>
        <span class="ts-chip">Tenure asli ${P.realTenure}</span>
        <span class="ts-chip">Toy: ${P.iters} iterasi, terbaik di iterasi ${run.bestIter}</span>
        ${isOpt ? '<span class="ts-chip green">= optimum brute force (3\u2078 kombinasi)</span>' : ''}
      </div>`;

    const b0 = createBoard(ctx.svg, body.querySelector('#ts-b0'), alive);
    const b1 = createBoard(ctx.svg, body.querySelector('#ts-b1'), alive);
    await b0.set(lpt, 0);
    await b1.set(lpt, 0);
    await ctx.sleep(900); if (!alive()) return;
    await b1.set(run.best, 1100);
  }

  Slides.register({
    id: 'slide-5',
    title: 'Tabu Search B: Tabu List & Hasil',
    steps: [
      { label: 'Tabu List (tenure 15)', enter: stepTabuList },
      { label: 'Larangan Kembali (X merah)', enter: stepBlocked },
      { label: 'Aspiration Criterion (X hijau)', enter: stepAspiration },
      { label: 'Iterasi & Konvergensi', enter: stepPlay },
      { label: 'Hasil Akhir vs LPT', enter: stepResult }
    ]
  });
})();